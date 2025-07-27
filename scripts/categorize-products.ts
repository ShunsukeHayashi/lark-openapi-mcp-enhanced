import { Client } from '@larksuiteoapi/node-sdk';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Lark client
const client = new Client({
  appId: process.env.APP_ID!,
  appSecret: process.env.APP_SECRET!,
});

const APP_TOKEN = 'W66tbCpb7avIjSsGvBhjRxtZpHc';
const TABLE_ID = 'tblPSgtK8IBbw9pP';

interface Product {
  record_id: string;
  fields: {
    [key: string]: any;
  };
}

async function fetchAllProducts(): Promise<Product[]> {
  const products: Product[] = [];
  let pageToken: string | undefined = undefined;
  
  do {
    const response = await client.bitable.appTableRecord.search({
      path: {
        app_token: APP_TOKEN,
        table_id: TABLE_ID,
      },
      params: {
        page_size: 500,
        page_token: pageToken,
      },
    });
    
    if (response.data?.items) {
      products.push(...response.data.items.map((item: any) => ({
        record_id: item.record_id,
        fields: item.fields
      })));
    }
    
    pageToken = response.data?.page_token;
  } while (pageToken);
  
  return products;
}

function analyzeAndCategorizeProducts(products: Product[]): Map<string, string> {
  const categoryMap = new Map<string, string>();
  
  // Analyze product names and characteristics to determine categories
  products.forEach(product => {
    // Extract product name from the field (it's in an array format)
    let productName = '';
    const nameField = product.fields['📝商品名'];
    if (Array.isArray(nameField) && nameField.length > 0) {
      productName = nameField[0].text || '';
    }
    
    // Extract price and sales data
    const unitPrice = product.fields['💰単価'] || 0;
    const salesVolume = product.fields['📈30日販売数 (数値)'] || 0;
    
    let category = 'Camera Equipment - Other';
    
    // Since all products are tripods (三脚), let's categorize them by type
    if (/プロフェッショナル|professional|プロ/i.test(productName)) {
      category = 'Camera Equipment - Professional Tripods';
    }
    else if (/軽量|light|トラベル|travel|コンパクト|compact/i.test(productName)) {
      category = 'Camera Equipment - Travel/Compact Tripods';
    }
    else if (/スマートフォン|smartphone|スマホ|phone/i.test(productName)) {
      category = 'Camera Equipment - Smartphone Tripods';
    }
    else if (/ビデオ|video|動画/i.test(productName)) {
      category = 'Camera Equipment - Video Tripods';
    }
    else if (/卓上|desk|テーブル|table|ミニ|mini/i.test(productName)) {
      category = 'Camera Equipment - Tabletop Tripods';
    }
    else if (/一脚|monopod/i.test(productName)) {
      category = 'Camera Equipment - Monopods';
    }
    else if (/雲台|head|ボールヘッド|ball head/i.test(productName)) {
      category = 'Camera Equipment - Tripod Heads';
    }
    else if (/テンプレート|template/i.test(productName)) {
      category = 'Template - Not for Sale';
    }
    else if (unitPrice >= 10000) {
      // High-end products based on price
      category = 'Camera Equipment - Premium Tripods';
    }
    else if (unitPrice < 5000) {
      // Budget products based on price
      category = 'Camera Equipment - Budget Tripods';
    }
    else {
      category = 'Camera Equipment - Standard Tripods';
    }
    
    categoryMap.set(product.record_id, category);
  });
  
  return categoryMap;
}

async function updateProductCategories(products: Product[], categoryMap: Map<string, string>) {
  // Process in batches to avoid rate limiting
  const batchSize = 5;
  const delayBetweenBatches = 1000; // 1 second
  
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    
    const updatePromises = batch.map(async (product) => {
      const category = categoryMap.get(product.record_id) || 'Uncategorized';
      
      try {
        await client.bitable.appTableRecord.update({
          path: {
            app_token: APP_TOKEN,
            table_id: TABLE_ID,
            record_id: product.record_id,
          },
          data: {
            fields: {
              'Category': category,
            },
          },
        });
        console.log(`Updated product ${product.record_id} with category: ${category}`);
      } catch (error: any) {
        console.error(`Failed to update product ${product.record_id}:`, error.message);
      }
    });
    
    await Promise.all(updatePromises);
    
    // Add delay between batches to avoid rate limiting
    if (i + batchSize < products.length) {
      console.log(`Waiting ${delayBetweenBatches}ms before next batch...`);
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
    }
  }
}

async function main() {
  try {
    console.log('Fetching products from Bitable...');
    const products = await fetchAllProducts();
    console.log(`Found ${products.length} products`);
    
    // Display sample product to understand the data structure
    if (products.length > 0) {
      console.log('\nSample product data:');
      console.log(JSON.stringify(products[0], null, 2));
    }
    
    console.log('\nAnalyzing and categorizing products...');
    const categoryMap = analyzeAndCategorizeProducts(products);
    
    // Show category distribution
    const categoryCount = new Map<string, number>();
    categoryMap.forEach(category => {
      categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
    });
    
    console.log('\nCategory distribution:');
    categoryCount.forEach((count, category) => {
      console.log(`${category}: ${count} products`);
    });
    
    console.log('\nUpdating products with categories...');
    await updateProductCategories(products, categoryMap);
    
    console.log('\nCategorization complete!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();