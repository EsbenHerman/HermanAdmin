package financial

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// PriceService handles fetching and storing asset prices
type PriceService struct {
	db     *pgxpool.Pool
	client *http.Client
}

// NewPriceService creates a new price service
func NewPriceService(db *pgxpool.Pool) *PriceService {
	return &PriceService{
		db: db,
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// YahooChartResponse represents the Yahoo Finance API response
type YahooChartResponse struct {
	Chart struct {
		Result []struct {
			Meta struct {
				Currency           string  `json:"currency"`
				RegularMarketPrice float64 `json:"regularMarketPrice"`
			} `json:"meta"`
		} `json:"result"`
		Error *struct {
			Code        string `json:"code"`
			Description string `json:"description"`
		} `json:"error"`
	} `json:"chart"`
}

// FetchPrice fetches the current price for a ticker from Yahoo Finance
func (s *PriceService) FetchPrice(ticker string) (float64, string, error) {
	url := fmt.Sprintf("https://query1.finance.yahoo.com/v8/finance/chart/%s?interval=1d&range=1d", ticker)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return 0, "", err
	}

	// Yahoo requires a User-Agent header
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")

	resp, err := s.client.Do(req)
	if err != nil {
		return 0, "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return 0, "", fmt.Errorf("yahoo finance returned status %d", resp.StatusCode)
	}

	var result YahooChartResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return 0, "", err
	}

	if result.Chart.Error != nil {
		return 0, "", fmt.Errorf("yahoo finance error: %s", result.Chart.Error.Description)
	}

	if len(result.Chart.Result) == 0 {
		return 0, "", fmt.Errorf("no data returned for ticker %s", ticker)
	}

	price := result.Chart.Result[0].Meta.RegularMarketPrice
	currency := result.Chart.Result[0].Meta.Currency

	return price, currency, nil
}

// UpdateAssetPrice stores a price for an asset
func (s *PriceService) UpdateAssetPrice(ctx context.Context, assetID int64, priceDate string, unitValue float64, source string) (*AssetPrice, error) {
	var price AssetPrice
	var pDate time.Time

	err := s.db.QueryRow(ctx, `
		INSERT INTO asset_prices (asset_id, price_date, unit_value, source)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (asset_id, price_date) DO UPDATE SET unit_value = $3, source = $4, created_at = NOW()
		RETURNING id, asset_id, price_date, unit_value, source, created_at
	`, assetID, priceDate, unitValue, source).Scan(
		&price.ID, &price.AssetID, &pDate, &price.UnitValue, &price.Source, &price.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	price.PriceDate = pDate.Format("2006-01-02")

	return &price, nil
}

// UpdateAllStockPrices fetches and stores prices for all stock assets
func (s *PriceService) UpdateAllStockPrices(ctx context.Context) ([]PriceUpdateResult, error) {
	// Get all stock assets with tickers
	rows, err := s.db.Query(ctx, `
		SELECT id, ticker, currency FROM assets 
		WHERE asset_type = 'stock' AND ticker IS NOT NULL AND ticker != ''
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	type stockAsset struct {
		ID       int64
		Ticker   string
		Currency string
	}

	var stocks []stockAsset
	for rows.Next() {
		var sa stockAsset
		if err := rows.Scan(&sa.ID, &sa.Ticker, &sa.Currency); err != nil {
			return nil, err
		}
		stocks = append(stocks, sa)
	}

	today := time.Now().Format("2006-01-02")
	var results []PriceUpdateResult

	for _, stock := range stocks {
		result := PriceUpdateResult{
			AssetID: stock.ID,
			Ticker:  stock.Ticker,
		}

		price, currency, err := s.FetchPrice(stock.Ticker)
		if err != nil {
			result.Error = err.Error()
			results = append(results, result)
			continue
		}

		// Store the price
		_, err = s.UpdateAssetPrice(ctx, stock.ID, today, price, "yahoo")
		if err != nil {
			result.Error = err.Error()
			results = append(results, result)
			continue
		}

		result.Price = price
		result.Currency = currency
		result.Success = true
		results = append(results, result)
	}

	return results, nil
}

// GetLatestPrice gets the most recent price for an asset
func (s *PriceService) GetLatestPrice(ctx context.Context, assetID int64, asOfDate string) (*AssetPrice, error) {
	var price AssetPrice
	var pDate time.Time

	err := s.db.QueryRow(ctx, `
		SELECT id, asset_id, price_date, unit_value, source, created_at
		FROM asset_prices
		WHERE asset_id = $1 AND price_date <= $2
		ORDER BY price_date DESC
		LIMIT 1
	`, assetID, asOfDate).Scan(
		&price.ID, &price.AssetID, &pDate, &price.UnitValue, &price.Source, &price.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	price.PriceDate = pDate.Format("2006-01-02")

	return &price, nil
}

// ListAssetPrices returns price history for an asset
func (s *PriceService) ListAssetPrices(ctx context.Context, assetID int64) ([]AssetPrice, error) {
	rows, err := s.db.Query(ctx, `
		SELECT id, asset_id, price_date, unit_value, source, created_at
		FROM asset_prices
		WHERE asset_id = $1
		ORDER BY price_date DESC
	`, assetID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var prices []AssetPrice
	for rows.Next() {
		var p AssetPrice
		var pDate time.Time
		if err := rows.Scan(&p.ID, &p.AssetID, &pDate, &p.UnitValue, &p.Source, &p.CreatedAt); err != nil {
			return nil, err
		}
		p.PriceDate = pDate.Format("2006-01-02")
		prices = append(prices, p)
	}

	return prices, nil
}
