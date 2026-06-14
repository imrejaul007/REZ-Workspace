# Tally Sync Module

## Overview

The Tally Sync module provides export functionality for integrating ReZ Merchant data with Tally Prime ERP. It generates XML files compatible with Tally's import format, supports GST reports, and maintains sync status tracking.

## Key Features

### Export Formats
- **Tally XML**: Native Tally import format
- **CSV Export**: Generic accounting software format
- **GSTR-1**: GST sales report
- **GSTR-3B**: GST summary return
- **Sales Reports**: Comprehensive sales accounting reports

### Transaction Types
- **Sales**: Customer invoices and payments
- **Purchases**: Supplier purchase orders and payments
- **Expenses**: Operating expenses
- **Adjustments**: Credit notes, debit notes

### Date Range Support
- Month-based filtering
- Cross-month selections
- Financial year support
- GST return periods

### Sync Features
- **Export History**: Track all exports
- **Re-export**: Re-download previous exports
- **Store-specific**: Export per store location
- **Validation**: Data validation before export

## API Endpoints

### Tally Export

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/merchant/export/tally` | Export as Tally XML |
| `GET` | `/merchant/export/csv` | Export as CSV |

### GST Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/merchant/export/gstr1` | Generate GSTR-1 data |
| `GET` | `/merchant/export/gstr3b` | Generate GSTR-3B data |

### Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/merchant/export/report` | Comprehensive sales report |

## Export Types

### Sales Export

```typescript
interface SalesExport {
  vouchers: [
    {
      type: 'Sales';
      date: Date;
      voucherNumber: string;
      partyName: string;
      partyGSTIN: string;
      placeOfSupply: string;
      items: [
        {
          name: string;
          quantity: number;
          rate: number;
          amount: number;
          discount: number;
          taxableAmount: number;
          taxRate: number;
          taxAmount: number;
          cess: number;
          hsnCode: string;
        }
      ];
      bill sundries: {
        cgst: number;
        sgst: number;
        igst: number;
        cess: number;
        roundOff: number;
        total: number;
      };
    }
  ];
}
```

### Purchase Export

```typescript
interface PurchaseExport {
  vouchers: [
    {
      type: 'Purchase';
      date: Date;
      voucherNumber: string;
      supplierName: string;
      supplierGSTIN: string;
      items: [...];
      bill sundries: {...};
    }
  ];
}
```

### GSTR-1 Data Structure

```typescript
interface GSTR1Data {
  gstin: string;
  fp: string;           // Financial period (MMYYYY)
  gt: number;           // Gross turnover
  cur_gt: number;       // Current gross turnover

  b2b: [
    {
      ctin: string;     // Customer GSTIN
      inv: [
        {
          inum: string;  // Invoice number
          idt: string;   // Invoice date
          val: number;   // Invoice value
          pos: string;   // Place of supply
          rchrg: string; // Reverse charge
          inv_typ: string;
          items: [
            {
              num: number;
              itmval: number;
              hscdn_sc: string;
              txval: number;
              rt: number;
              camt: number;
              samt: number;
              iamt: number;
            }
          ];
        }
      ];
    }
  ];

  b2cl: [
    {
      inv: [
        {
          inum: string;
          idt: string;
          val: number;
          pos: string;
          items: [...];
        }
      ];
    }
  ];

  nil: {
    expt: number;
    nil_supplies: number;
    ngsupplies: number;
  };
}
```

## Request/Response Examples

### Tally XML Export

**Request:**
```
GET /merchant/export/tally?storeId=507f1f77bcf86cd799439011&fromMonth=2026-01&toMonth=2026-03&type=sales
```

**Response:**
Content-Type: application/xml
Content-Disposition: attachment; filename="Tally_sales_2026-01_2026-03.xml"

```xml
<?xml version="1.0" encoding="UTF-8"?>
<TALLYMESSAGE xmlns:UDF="UDF">
  <VOUCHER>
    <DATE>20260115</DATE>
    <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
    <VOUCHERNUMBER>INV-2026-00001</VOUCHERNUMBER>
    <PARTYNAME>Customer ABC</PARTYNAME>
    <PARTYLEDGERNAME>ABC Customers</PARTYLEDGERNAME>
    <BASICBASHEdITAMOUNT>118000</BASICBASHEdITAMOUNT>
    <LEDGERENTRIES.LIST>
      <LEDGERNAME>Sales</LEDGERNAME>
      <AMOUNT>-100000</AMOUNT>
    </LEDGERENTRIES.LIST>
    <LEDGERENTRIES.LIST>
      <LEDGERNAME>CGST</LEDGERNAME>
      <AMOUNT>-9000</AMOUNT>
    </LEDGERENTRIES.LIST>
    <LEDGERENTRIES.LIST>
      <LEDGERNAME>SGST</LEDGERNAME>
      <AMOUNT>-9000</AMOUNT>
    </LEDGERENTRIES.LIST>
  </VOUCHER>
</TALLYMESSAGE>
```

### CSV Export

**Request:**
```
GET /merchant/export/csv?storeId=507f1f77bcf86cd799439011&fromMonth=2026-01&toMonth=2026-03
```

**Response:**
```csv
Date,Voucher Number,Party,GSTIN,Item,HSN,Qty,Rate,Amount,CGST,SGST,IGST,Total
2026-01-15,INV-2026-00001,Customer ABC,27AABCU9603R1ZM,Product A,9401,10,10000,100000,9000,9000,0,118000
2026-01-20,INV-2026-00002,Customer XYZ,29AABCU9603R1ZM,Product B,9402,5,5000,25000,2250,2250,0,29500
```

### GSTR-1 Export

**Request:**
```
GET /merchant/export/gstr1?storeId=507f1f77bcf86cd799439011&month=2026-01
```

**Response:**
```json
{
  "success": true,
  "data": {
    "gstin": "27AABCU9603R1ZM",
    "fp": "012026",
    "gt": 1000000,
    "cur_gt": 500000,
    "b2b": [
      {
        "ctin": "29AABCU9603R1ZM",
        "inv": [
          {
            "inum": "INV-2026-00001",
            "idt": "2026-01-15",
            "val": 118000,
            "pos": "29",
            "rchrg": "N",
            "inv_typ": "R",
            "items": [
              {
                "num": 1,
                "itmval": 118000,
                "hsdn_sc": "9401",
                "txval": 100000,
                "rt": 18,
                "camt": 9000,
                "samt": 9000,
                "iamt": 0
              }
            ]
          }
        ]
      }
    ],
    "b2cl": [],
    "nil": {
      "expt": 0,
      "nil_supplies": 0,
      "ngsupplies": 0
    },
    "summary": {
      "totalInvoices": 50,
      "totalValue": 5000000,
      "totalTax": 900000,
      "totalCGST": 450000,
      "totalSGST": 450000,
      "totalIGST": 0
    }
  },
  "period": "2026-01"
}
```

## Tally XML Structure

### Master Elements

```xml
<!-- Company -->
<COMPANY>
  <NAME>Company Name</NAME>
  <ADDRESS>...</ADDRESS>
  <STATENAME>Maharashtra</STATENAME>
  <PINCODE>400001</PINCODE>
  <PHONENUMBER>...</PHONENUMBER>
  <EMAILADDRESS>...</EMAILADDRESS>
  <WEBSITE>...</WEBSITE>
  <STATECODE>27</STATECODE>
  <COUNTRYNAME>India</COUNTRYNAME>
  <GSTREGISTRATIONTYPE>Regular</GSTREGISTRATIONTYPE>
  <GSTIN>27AABCU9603R1ZM</GSTIN>
</COMPANY>

<!-- Ledger -->
<LEDGER>
  <NAME>Sales Account</NAME>
  <PARENT>Sales Accounts</PARENT>
  <GSTAPPLICABLE>Yes</GSTAPPLICABLE>
  <TAXTYPE>GST</TAXTYPE>
  <RATEOFVAT_CST>0</RATEOFVAT_CST>
</LEDGER>
```

### Voucher Elements

```xml
<VOUCHER>
  <DATE>YYYYMMDD</DATE>
  <VOUCHERTYPENAME>Sales|Purchase|Payment|Receipt</VOUCHERTYPENAME>
  <VOUCHERNUMBER>INV-001</VOUCHERNUMBER>
  <PARTYNAME>Customer Name</PARTYNAME>
  <PARTYLEDGERNAME>Debtors</PARTYLEDGERNAME>
  <PERSISTEDVIEW>Invoice Vch View</PERSISTEDVIEW>
  <BASICBASHEdITAMOUNT>118000</BASICBASHEdITAMOUNT>

  <LEDGERENTRIES.LIST>
    <LEDGERNAME>Sales</LEDGERNAME>
    <AMOUNT>-100000</AMOUNT>
    <GSTCLASSifications.LIST>...</GSTCLASSifications.LIST>
  </LEDGERENTRIES.LIST>

  <INVENTORYENTRIES.LIST>
    <STOCKITEMNAME>Product</STOCKITEMNAME>
    <ISINEMWD>Yes</ISINEMWD>
    <RATE>10000/1</RATE>
    <AMOUNT>100000</AMOUNT>
    <ACTUALQTY>10</ACTUALQTY>
    <BILLEDQTY>10</BILLEDQTY>
  </INVENTORYENTRIES.LIST>
</VOUCHER>
```

## Configuration

### GST Rates

```typescript
const GST_RATES = {
  '0': 0,       // Exempt
  '5': 5,       // 5%
  '12': 12,     // 12%
  '18': 18,     // 18%
  '28': 28,     // 28%
};
```

### HSN Code Mapping

```typescript
const HSN_CATEGORIES = {
  '9401': 'Furniture',
  '9403': 'Furniture',
  '8504': 'Electronics',
  '5208': 'Textiles',
  // ...
};
```

### State Code Mapping

```typescript
const STATE_CODES = {
  'Maharashtra': '27',
  'Delhi': '07',
  'Karnataka': '29',
  // ...
};
```

## Error Handling

### Validation Errors

| Error | Description |
|-------|-------------|
| Store ID required | Must specify storeId |
| Invalid month format | Use YYYY-MM format |
| Invalid date range | End must be after start |
| No data found | No transactions in period |

### Export Errors

| Error | Description |
|-------|-------------|
| XML parse error | Invalid data structure |
| GSTIN invalid | Invalid GSTIN format |
| Missing GSTIN | Party missing GSTIN |

## Related Modules

| Module | Integration |
|--------|-------------|
| Sales/Orders | Transaction data source |
| Purchase Orders | Purchase transactions |
| GST Filing | Tax calculations |
| Reconciliation | Payment matching |

## File Structure

```
src/routes/
  tallyExport.ts         # Tally export routes

src/services/
  tallyExport.ts        # Export generation service

src/utils/
  xmlBuilder.ts        # XML generation helpers
  gstCalculator.ts     # GST calculation utilities
```

## Tally Import Process

1. Export data from ReZ Merchant
2. Download XML/CSV file
3. Open Tally Prime
4. Go to: Gateway of Tally > Import > Vouchers
5. Select the XML file
6. Map fields if required
7. Import and verify

## Best Practices

- Export monthly to match GST return periods
- Verify totals after import
- Keep backup of exported files
- Reconcile with bank statements
