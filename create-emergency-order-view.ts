import { Client } from '@larksuiteoapi/node-sdk';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const APP_ID = process.env.APP_ID!;
const APP_SECRET = process.env.APP_SECRET!;

// Initialize the client
const client = new Client({
  appId: APP_ID,
  appSecret: APP_SECRET,
  domain: 'https://open.larksuite.com',
  loggerLevel: 2
});

// Base app and table information from the URL
const APP_TOKEN = 'KgFMw2G2Yiphx7kxNz0jA8DFpqd';
const TABLE_ID = 'blkaRu69SEx1D08B';

async function createEmergencyOrderView() {
  try {
    console.log('🚀 Creating Emergency Order Alert View...');
    
    // Step 1: Create the view
    console.log('\n1️⃣ Creating new view...');
    const createViewResponse = await client.bitable.appTableView.create({
      path: {
        app_token: APP_TOKEN,
        table_id: TABLE_ID
      },
      data: {
        view_name: '🚨緊急発注アラート',
        view_type: 'grid'
      }
    });

    if (!createViewResponse.data?.view) {
      throw new Error('Failed to create view');
    }

    const viewId = createViewResponse.data.view.view_id;
    console.log(`✅ View created with ID: ${viewId}`);

    // Step 2: Get field information to find the correct field IDs
    console.log('\n2️⃣ Getting field information...');
    const fieldsResponse = await client.bitable.appTableField.list({
      path: {
        app_token: APP_TOKEN,
        table_id: TABLE_ID
      },
      params: {
        page_size: 100
      }
    });

    const fields = fieldsResponse.data?.items || [];
    console.log(`Found ${fields.length} fields`);

    // Map field names to IDs (you'll need to adjust these based on actual field names)
    const fieldMap: Record<string, string> = {};
    fields.forEach((field: any) => {
      fieldMap[field.field_name] = field.field_id;
      console.log(`  - ${field.field_name}: ${field.field_id}`);
    });

    // Step 3: Update view with filters and sorting
    console.log('\n3️⃣ Configuring view filters and sorting...');
    
    // Find the required field IDs
    const urgentFlagFieldId = fieldMap['緊急発注フラグ'] || fieldMap['Urgent Order Flag'] || '';
    const orderRemainingFieldId = fieldMap['発注残数'] || fieldMap['Order Remaining'] || '';
    const stockoutPredictionFieldId = fieldMap['在庫切れ予測'] || fieldMap['Stockout Prediction'] || '';
    const sales30DaysFieldId = fieldMap['30日販売数'] || fieldMap['30 Days Sales'] || '';
    const profitRateFieldId = fieldMap['利益率'] || fieldMap['Profit Rate'] || '';

    // Update view with filters
    const updateViewResponse = await client.bitable.appTableView.patch({
      path: {
        app_token: APP_TOKEN,
        table_id: TABLE_ID,
        view_id: viewId
      },
      data: {
        property: {
          filter_info: {
            conjunction: 'and',
            conditions: [
              {
                field_id: urgentFlagFieldId,
                operator: 'is',
                value: '🚩緊急'
              },
              {
                field_id: orderRemainingFieldId,
                operator: 'is',
                value: '0'
              },
              {
                field_id: stockoutPredictionFieldId,
                operator: 'isLess',
                value: '30'
              },
              {
                field_id: sales30DaysFieldId,
                operator: 'isGreater',
                value: '0'
              }
            ]
          }
        }
      }
    });

    console.log('✅ View configuration updated successfully!');

    // Step 4: Display success message
    console.log('\n🎉 Emergency Order Alert View created successfully!');
    console.log(`📍 View URL: https://f82jyx0mblu.jp.larksuite.com/base/${APP_TOKEN}?table=${TABLE_ID}&view=${viewId}`);
    
    return viewId;

  } catch (error) {
    console.error('❌ Error creating view:', error);
    throw error;
  }
}

// Run the function
createEmergencyOrderView()
  .then(() => {
    console.log('\n✅ Process completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Process failed:', error);
    process.exit(1);
  });