"""
AssetMind - API Documentation
Swagger/OpenAPI

Version: 1.0.0
"""

SWAGGER_CONFIG = """
openapi: 3.0.0
info:
  title: AssetMind API
  description: Financial Intelligence OS API
  version: 1.0.0

servers:
  - url: https://api.assetmind.ai
    description: Production
  - url: http://localhost:5298
    description: Development

paths:
  /council/convene:
    post:
      summary: Get Council Decision
      tags: [Council]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                symbol:
                  type: string
                  example: NVDA
      responses:
        '200':
          description: Council decision

  /rexmind/forecast:
    post:
      summary: Get Price Forecast
      tags: [AI]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                symbol:
                  type: string
                candles:
                  type: array
      responses:
        '200':
          description: Price forecast

  /backtest:
    post:
      summary: Run Backtest
      tags: [Trading]
      responses:
        '200':
          description: Backtest results
"""

# Run: pip install swagger-ui-py
# Then serve at /docs
