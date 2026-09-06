export interface SampleJobEntry {
  id: string;
  name: string;
  filename: string;
  format: 'DSX' | 'XML';
  description: string;
  complexity: 'Standard' | 'Advanced' | 'Enterprise Multi-Source';
  content: string;
}

export const SAMPLE_DATASTAGE_JOBS: SampleJobEntry[] = [
  {
    id: 'customer_360_enrichment',
    name: 'Customer 360 & Loyalty Enrichment',
    filename: 'Customer_360_Enrichment.dsx',
    format: 'DSX',
    description: 'Enriches DB2 customer master records with loyalty lookup tiers, filters active accounts, cleanses names, and loads into Snowflake/Oracle analytics target table.',
    complexity: 'Advanced',
    content: `BEGIN HEADER
   CharacterSet "CP1252"
   ExportingTool "IBM InfoSphere DataStage Export"
   ToolVersion "8"
   ServerName "DS_PROD_CLUSTER"
   ToolInstanceID "DS_INSTANCE_01"
END HEADER
BEGIN DSJOB
   Identifier "Job_Customer_360_Enrichment"
   DateModified "2024-03-15"
   TimeModified "14.30.22"
   Category "\\Enterprise_Analytics\\Customer"
   JobType "3"
   Description "Enrich customer master with loyalty tiers, apply KYC status filters, derive full names and compute tax bands"

   BEGIN DSRECORD
      Identifier "V0S0"
      OLEType "CCustomStage"
      Readonly "0"
      Name "Src_DB2_Customers"
      NextID "2"
      OutputPins "V0S0P1"
      StageType "PxDB2"
      BEGIN DSSUBRECORD
         Name "tableName"
         Value "PROD_DB2.CUSTOMERS"
      END DSSUBRECORD
      BEGIN DSSUBRECORD
         Name "SelectStatement"
         Value "SELECT CUST_ID, FIRST_NAME, LAST_NAME, EMAIL, REG_DATE, STATUS, COUNTRY_CODE, TOTAL_SPEND FROM PROD_DB2.CUSTOMERS"
      END DSSUBRECORD
   END DSRECORD

   BEGIN DSRECORD
      Identifier "V0S0P1"
      OLEType "CCustomOutput"
      Name "Lnk_Cust_Raw"
      Partner "V0S2|V0S2P1"
      BEGIN DSSUBRECORD
         Name "CUST_ID"
         SqlType "4"
         Precision "10"
         Scale "0"
         Nullable "0"
      END DSSUBRECORD
      BEGIN DSSUBRECORD
         Name "FIRST_NAME"
         SqlType "12"
         Precision "50"
         Scale "0"
         Nullable "1"
      END DSSUBRECORD
      BEGIN DSSUBRECORD
         Name "LAST_NAME"
         SqlType "12"
         Precision "50"
         Scale "0"
         Nullable "1"
      END DSSUBRECORD
      BEGIN DSSUBRECORD
         Name "EMAIL"
         SqlType "12"
         Precision "100"
         Scale "0"
         Nullable "1"
      END DSSUBRECORD
      BEGIN DSSUBRECORD
         Name "REG_DATE"
         SqlType "9"
         Precision "10"
         Scale "0"
         Nullable "1"
      END DSSUBRECORD
      BEGIN DSSUBRECORD
         Name "STATUS"
         SqlType "1"
         Precision "1"
         Scale "0"
         Nullable "0"
      END DSSUBRECORD
      BEGIN DSSUBRECORD
         Name "COUNTRY_CODE"
         SqlType "1"
         Precision "3"
         Scale "0"
         Nullable "1"
      END DSSUBRECORD
      BEGIN DSSUBRECORD
         Name "TOTAL_SPEND"
         SqlType "3"
         Precision "12"
         Scale "2"
         Nullable "1"
      END DSSUBRECORD
   END DSRECORD

   BEGIN DSRECORD
      Identifier "V0S1"
      OLEType "CCustomStage"
      Readonly "0"
      Name "Src_SeqFile_Loyalty"
      NextID "2"
      OutputPins "V0S1P1"
      StageType "PxSequentialFile"
      BEGIN DSSUBRECORD
         Name "FilePath"
         Value "/data/landing/loyalty_tiers_ref.csv"
      END DSSUBRECORD
      BEGIN DSSUBRECORD
         Name "Delimiter"
         Value ","
      END DSSUBRECORD
   END DSRECORD

   BEGIN DSRECORD
      Identifier "V0S1P1"
      OLEType "CCustomOutput"
      Name "Lnk_Loyalty_Ref"
      Partner "V0S2|V0S2P2"
      BEGIN DSSUBRECORD
         Name "CUST_ID"
         SqlType "4"
         Precision "10"
         Scale "0"
         Nullable "0"
      END DSSUBRECORD
      BEGIN DSSUBRECORD
         Name "TIER_CODE"
         SqlType "12"
         Precision "20"
         Scale "0"
         Nullable "1"
      END DSSUBRECORD
      BEGIN DSSUBRECORD
         Name "DISCOUNT_PCT"
         SqlType "3"
         Precision "5"
         Scale "2"
         Nullable "1"
      END DSSUBRECORD
   END DSRECORD

   BEGIN DSRECORD
      Identifier "V0S2"
      OLEType "CCustomStage"
      Readonly "0"
      Name "Lkp_Customer_Loyalty"
      NextID "3"
      InputPins "V0S0P1|V0S1P1"
      OutputPins "V0S2P3"
      StageType "PxLookup"
      BEGIN DSSUBRECORD
         Name "JoinType"
         Value "LeftOuter"
      END DSSUBRECORD
      BEGIN DSSUBRECORD
         Name "Key"
         Value "CUST_ID"
      END DSSUBRECORD
   END DSRECORD

   BEGIN DSRECORD
      Identifier "V0S3"
      OLEType "CCustomStage"
      Readonly "0"
      Name "Fil_Active_Accounts"
      NextID "3"
      InputPins "V0S2P3"
      OutputPins "V0S3P1"
      StageType "PxFilter"
      BEGIN DSSUBRECORD
         Name "Where"
         Value "STATUS = 'A' AND COUNTRY_CODE IN ('US', 'CA', 'UK')"
      END DSSUBRECORD
   END DSRECORD

   BEGIN DSRECORD
      Identifier "V0S4"
      OLEType "CTransformerStage"
      Readonly "0"
      Name "Trn_Enrich_Customer"
      NextID "3"
      InputPins "V0S3P1"
      OutputPins "V0S4P1"
      StageType "PxTransformer"
      BEGIN DSSUBRECORD
         Name "Derivation"
         Value "NextSurrogateKey()"
         Name "CUSTOMER_SK"
      END DSSUBRECORD
      BEGIN DSSUBRECORD
         Name "Derivation"
         Value "Trim(Lnk_In.FIRST_NAME) : ' ' : Trim(Lnk_In.LAST_NAME)"
         Name "FULL_NAME"
      END DSSUBRECORD
      BEGIN DSSUBRECORD
         Name "Derivation"
         Value "If IsNull(Lnk_In.TIER_CODE) Then 'STANDARD' Else UpCase(Lnk_In.TIER_CODE)"
         Name "LOYALTY_TIER"
      END DSSUBRECORD
      BEGIN DSSUBRECORD
         Name "Derivation"
         Value "NullToZero(Lnk_In.DISCOUNT_PCT)"
         Name "DISCOUNT_RATE"
      END DSSUBRECORD
      BEGIN DSSUBRECORD
         Name "Derivation"
         Value "If Lnk_In.COUNTRY_CODE = 'US' Then 0.0825 Else 0.15"
         Name "APPLIED_TAX_RATE"
      END DSSUBRECORD
      BEGIN DSSUBRECORD
         Name "Derivation"
         Value "CurrentTimestamp()"
         Name "DW_LOAD_TIMESTAMP"
      END DSSUBRECORD
   END DSRECORD

   BEGIN DSRECORD
      Identifier "V0S4P1"
      OLEType "CTrnOutput"
      Name "Lnk_Transformed_Out"
      Partner "V0S5|V0S5P1"
      BEGIN DSSUBRECORD
         Name "CUSTOMER_SK"
         SqlType "4"
         Precision "10"
         Scale "0"
         Nullable "0"
         Derivation "NextSurrogateKey()"
      END DSSUBRECORD
      BEGIN DSSUBRECORD
         Name "CUST_ID"
         SqlType "4"
         Precision "10"
         Scale "0"
         Nullable "0"
         Derivation "Lnk_In.CUST_ID"
      END DSSUBRECORD
      BEGIN DSSUBRECORD
         Name "FULL_NAME"
         SqlType "12"
         Precision "100"
         Scale "0"
         Nullable "1"
         Derivation "Trim(Lnk_In.FIRST_NAME) : ' ' : Trim(Lnk_In.LAST_NAME)"
      END DSSUBRECORD
      BEGIN DSSUBRECORD
         Name "EMAIL_CLEANSED"
         SqlType "12"
         Precision "100"
         Scale "0"
         Nullable "1"
         Derivation "DownCase(Trim(Lnk_In.EMAIL))"
      END DSSUBRECORD
      BEGIN DSSUBRECORD
         Name "LOYALTY_TIER"
         SqlType "12"
         Precision "20"
         Scale "0"
         Nullable "0"
         Derivation "If IsNull(Lnk_In.TIER_CODE) Then 'STANDARD' Else UpCase(Lnk_In.TIER_CODE)"
      END DSSUBRECORD
      BEGIN DSSUBRECORD
         Name "DISCOUNT_RATE"
         SqlType "3"
         Precision "5"
         Scale "2"
         Nullable "0"
         Derivation "NullToZero(Lnk_In.DISCOUNT_PCT)"
      END DSSUBRECORD
      BEGIN DSSUBRECORD
         Name "APPLIED_TAX_RATE"
         SqlType "3"
         Precision "5"
         Scale "4"
         Nullable "0"
         Derivation "If Lnk_In.COUNTRY_CODE = 'US' Then 0.0825 Else 0.15"
      END DSSUBRECORD
      BEGIN DSSUBRECORD
         Name "TOTAL_SPEND"
         SqlType "3"
         Precision "12"
         Scale "2"
         Nullable "1"
         Derivation "NullToZero(Lnk_In.TOTAL_SPEND)"
      END DSSUBRECORD
      BEGIN DSSUBRECORD
         Name "DW_LOAD_TIMESTAMP"
         SqlType "11"
         Precision "26"
         Scale "6"
         Nullable "0"
         Derivation "CurrentTimestamp()"
      END DSSUBRECORD
   END DSRECORD

   BEGIN DSRECORD
      Identifier "V0S5"
      OLEType "CCustomStage"
      Readonly "0"
      Name "Tgt_Oracle_DimCustomer"
      NextID "2"
      InputPins "V0S4P1"
      StageType "PxOracle"
      BEGIN DSSUBRECORD
         Name "tableName"
         Value "ANALYTICS_DWH.DIM_CUSTOMER"
      END DSSUBRECORD
      BEGIN DSSUBRECORD
         Name "LoadAction"
         Value "Upsert / Merge"
      END DSSUBRECORD
   END DSRECORD
END DSJOB
`,
  },
  {
    id: 'financial_fraud_detection',
    name: 'Financial Fraud Risk & Transaction Cleansing',
    filename: 'Financial_Transaction_Fraud_ETL.xml',
    format: 'XML',
    description: 'XML export featuring multi-table joins, blacklisted merchants filter, risk scoring calculations, and high-velocity transaction loading.',
    complexity: 'Enterprise Multi-Source',
    content: `<?xml version="1.0" encoding="UTF-8"?>
<DSExport>
   <Header CharacterSet="CP1252" ExportingTool="IBM InfoSphere DataStage Export" ToolVersion="8"/>
   <Job Identifier="Job_Financial_Transaction_Fraud_ETL" Type="Parallel">
      <Property Name="Category">\\Finance\\Fraud_Monitoring</Property>
      <Property Name="Description">High-velocity transaction streaming ETL with merchant sanctions check, high-risk score thresholding, and fee calculations</Property>

      <!-- Source 1: Core Transaction Stream -->
      <Stage Name="Src_Oracle_Transactions" Type="CustomStage" StageType="PxOracle">
         <Property Name="TableName">FIN_CORE.TXN_LEDGER</Property>
         <Property Name="SelectStatement">SELECT TXN_ID, ACCOUNT_NO, MERCHANT_ID, TXN_AMOUNT, TXN_TIMESTAMP, CURRENCY, TXN_CHANNEL FROM FIN_CORE.TXN_LEDGER WHERE TXN_TIMESTAMP &gt;= TRUNC(SYSDATE - 1)</Property>
         <OutputPin Name="Lnk_Txn_Stream">
            <Record>
               <Column Name="TXN_ID" SqlType="INTEGER" Length="12" Nullable="0"/>
               <Column Name="ACCOUNT_NO" SqlType="VARCHAR" Length="30" Nullable="0"/>
               <Column Name="MERCHANT_ID" SqlType="VARCHAR" Length="20" Nullable="0"/>
               <Column Name="TXN_AMOUNT" SqlType="DECIMAL" Precision="14" Scale="2" Nullable="0"/>
               <Column Name="TXN_TIMESTAMP" SqlType="TIMESTAMP" Length="26" Nullable="0"/>
               <Column Name="CURRENCY" SqlType="CHAR" Length="3" Nullable="0"/>
               <Column Name="TXN_CHANNEL" SqlType="VARCHAR" Length="20" Nullable="1"/>
            </Record>
         </OutputPin>
      </Stage>

      <!-- Source 2: Sanctioned Merchants -->
      <Stage Name="Src_Sanctioned_Merchants" Type="CustomStage" StageType="PxSequentialFile">
         <Property Name="FilePath">/opt/datastage/reference/sanctioned_merchants.csv</Property>
         <OutputPin Name="Lnk_Sanction_Ref">
            <Record>
               <Column Name="MERCHANT_ID" SqlType="VARCHAR" Length="20" Nullable="0"/>
               <Column Name="MERCHANT_NAME" SqlType="VARCHAR" Length="100" Nullable="1"/>
               <Column Name="RISK_SCORE" SqlType="INTEGER" Length="5" Nullable="0"/>
               <Column Name="WATCHLIST_REASON" SqlType="VARCHAR" Length="150" Nullable="1"/>
            </Record>
         </OutputPin>
      </Stage>

      <!-- Join: Inner Join with Sanctioned Merchant List -->
      <Stage Name="Jn_Transactions_Merchant" Type="CustomStage" StageType="PxJoin">
         <Property Name="JoinType">Inner</Property>
         <Property Name="Key">MERCHANT_ID</Property>
      </Stage>

      <!-- Filter: Filter for High Risk Score or Suspicious Amount -->
      <Stage Name="Fil_Suspicious_Activity" Type="CustomStage" StageType="PxFilter">
         <Property Name="Where">RISK_SCORE &gt;= 75 OR TXN_AMOUNT &gt;= 10000.00</Property>
         <Property Name="RejectLink">Lnk_Low_Risk_Discard</Property>
      </Stage>

      <!-- Transformer: Fraud Classification & Surcharge -->
      <Stage Name="Trn_Fraud_Risk_Evaluation" Type="CustomStage" StageType="PxTransformer">
         <Property Name="StageVar_AuditFlag">If RISK_SCORE &gt; 90 Then 'CRITICAL' Else 'ELEVATED'</Property>
         <OutputPin Name="Lnk_Alert_Out">
            <Record>
               <Column Name="ALERT_ID" SqlType="INTEGER" Length="12" Nullable="0" Derivation="NextSurrogateKey()"/>
               <Column Name="ORIG_TXN_ID" SqlType="INTEGER" Length="12" Nullable="0" Derivation="Lnk_In.TXN_ID"/>
               <Column Name="ACCOUNT_NO" SqlType="VARCHAR" Length="30" Nullable="0" Derivation="Lnk_In.ACCOUNT_NO"/>
               <Column Name="MERCHANT_ID" SqlType="VARCHAR" Length="20" Nullable="0" Derivation="Lnk_In.MERCHANT_ID"/>
               <Column Name="CLEAN_MERCHANT_NAME" SqlType="VARCHAR" Length="100" Nullable="1" Derivation="UpCase(Trim(Lnk_In.MERCHANT_NAME))"/>
               <Column Name="FLAGGED_AMOUNT_USD" SqlType="DECIMAL" Precision="14" Scale="2" Nullable="0" Derivation="If Lnk_In.CURRENCY = 'EUR' Then Lnk_In.TXN_AMOUNT * 1.08 Else Lnk_In.TXN_AMOUNT"/>
               <Column Name="RISK_SEVERITY" SqlType="VARCHAR" Length="20" Nullable="0" Derivation="If Lnk_In.RISK_SCORE &gt;= 90 Then 'CRITICAL' Else 'HIGH'"/>
               <Column Name="SURCHARGE_PENALTY" SqlType="DECIMAL" Precision="10" Scale="2" Nullable="0" Derivation="Round(Lnk_In.TXN_AMOUNT * 0.035, 2)"/>
               <Column Name="INVESTIGATION_STATUS" SqlType="VARCHAR" Length="30" Nullable="0" Derivation="'PENDING_INVESTIGATION'"/>
               <Column Name="RECORDED_AT" SqlType="TIMESTAMP" Length="26" Nullable="0" Derivation="CurrentTimestamp()"/>
            </Record>
         </OutputPin>
      </Stage>

      <!-- Target: Enterprise Anti-Fraud Alert Queue -->
      <Stage Name="Tgt_Fraud_Alert_Queue" Type="CustomStage" StageType="PxOracle">
         <Property Name="TableName">DWH_SECURITY.FRAUD_ALERT_QUEUE</Property>
         <Property Name="LoadAction">Append</Property>
      </Stage>
   </Job>
</DSExport>
`,
  },
  {
    id: 'supply_chain_inventory',
    name: 'Supply Chain Inventory & Restock Aggregator',
    filename: 'Inventory_Restock_Pipeline.dsx',
    format: 'DSX',
    description: 'Inventory monitoring job evaluating warehouse stock levels against safety stock thresholds with restock priority derivations.',
    complexity: 'Standard',
    content: `BEGIN HEADER
   CharacterSet "CP1252"
   ExportingTool "IBM InfoSphere DataStage Export"
   ToolVersion "8"
END HEADER
BEGIN DSJOB
   Identifier "Job_Inventory_Restock_Pipeline"
   Category "\\SupplyChain\\Warehouse"
   Description "Evaluate warehouse on-hand inventory vs reorder levels and flag critical restocking orders"

   BEGIN DSRECORD
      Identifier "S0"
      OLEType "CCustomStage"
      Name "Src_Warehouse_Inventory"
      StageType "PxODBC"
      BEGIN DSSUBRECORD
         Name "tableName"
         Value "WMS.INVENTORY_BALANCE"
      END DSSUBRECORD
   END DSRECORD

   BEGIN DSRECORD
      Identifier "S0P1"
      OLEType "CCustomOutput"
      Name "Lnk_Inv_Raw"
      BEGIN DSSUBRECORD
         Name "SKU_ID"
         SqlType "12"
         Precision "25"
         Nullable "0"
      END DSSUBRECORD
      BEGIN DSSUBRECORD
         Name "WAREHOUSE_CODE"
         SqlType "12"
         Precision "10"
         Nullable "0"
      END DSSUBRECORD
      BEGIN DSSUBRECORD
         Name "QTY_ON_HAND"
         SqlType "4"
         Precision "10"
         Nullable "0"
      END DSSUBRECORD
      BEGIN DSSUBRECORD
         Name "REORDER_POINT"
         SqlType "4"
         Precision "10"
         Nullable "0"
      END DSSUBRECORD
      BEGIN DSSUBRECORD
         Name "UNIT_COST"
         SqlType "3"
         Precision "10"
         Scale "2"
         Nullable "1"
      END DSSUBRECORD
   END DSRECORD

   BEGIN DSRECORD
      Identifier "S1"
      OLEType "CCustomStage"
      Name "Fil_Low_Stock"
      StageType "PxFilter"
      BEGIN DSSUBRECORD
         Name "Where"
         Value "QTY_ON_HAND <= REORDER_POINT"
      END DSSUBRECORD
   END DSRECORD

   BEGIN DSRECORD
      Identifier "S2"
      OLEType "CTransformerStage"
      Name "Trn_Restock_Calculations"
      StageType "PxTransformer"
   END DSRECORD

   BEGIN DSRECORD
      Identifier "S2P1"
      OLEType "CTrnOutput"
      Name "Lnk_Restock_Orders"
      BEGIN DSSUBRECORD
         Name "ORDER_ID"
         SqlType "4"
         Precision "10"
         Nullable "0"
         Derivation "NextSurrogateKey()"
      END DSSUBRECORD
      BEGIN DSSUBRECORD
         Name "SKU_ID"
         SqlType "12"
         Precision "25"
         Nullable "0"
         Derivation "Lnk_In.SKU_ID"
      END DSSUBRECORD
      BEGIN DSSUBRECORD
         Name "WAREHOUSE_CODE"
         SqlType "12"
         Precision "10"
         Nullable "0"
         Derivation "UpCase(Trim(Lnk_In.WAREHOUSE_CODE))"
      END DSSUBRECORD
      BEGIN DSSUBRECORD
         Name "DEFICIT_QTY"
         SqlType "4"
         Precision "10"
         Nullable "0"
         Derivation "Lnk_In.REORDER_POINT - Lnk_In.QTY_ON_HAND"
      END DSSUBRECORD
      BEGIN DSSUBRECORD
         Name "RECOMMENDED_ORDER_QTY"
         SqlType "4"
         Precision "10"
         Nullable "0"
         Derivation "(Lnk_In.REORDER_POINT - Lnk_In.QTY_ON_HAND) * 2"
      END DSSUBRECORD
      BEGIN DSSUBRECORD
         Name "ESTIMATED_ORDER_COST"
         SqlType "3"
         Precision "12"
         Scale "2"
         Nullable "1"
         Derivation "((Lnk_In.REORDER_POINT - Lnk_In.QTY_ON_HAND) * 2) * NullToZero(Lnk_In.UNIT_COST)"
      END DSSUBRECORD
      BEGIN DSSUBRECORD
         Name "URGENCY_TIER"
         SqlType "12"
         Precision "20"
         Nullable "0"
         Derivation "If Lnk_In.QTY_ON_HAND = 0 Then 'CRITICAL_OUT_OF_STOCK' Else 'STANDARD_REORDER'"
      END DSSUBRECORD
   END DSRECORD

   BEGIN DSRECORD
      Identifier "S3"
      OLEType "CCustomStage"
      Name "Tgt_Procurement_Orders"
      StageType "PxSnowflake"
      BEGIN DSSUBRECORD
         Name "tableName"
         Value "PROCUREMENT.RESTOCK_ORDERS"
      END DSSUBRECORD
      BEGIN DSSUBRECORD
         Name "LoadAction"
         Value "Insert"
      END DSSUBRECORD
   END DSRECORD
END DSJOB
`,
  },
];
