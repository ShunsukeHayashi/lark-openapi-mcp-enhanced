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

// Define the categories you want
const CATEGORIES = [
  { name: 'Camera Equipment - Professional Tripods', color: 0 },
  { name: 'Camera Equipment - Travel/Compact Tripods', color: 1 },
  { name: 'Camera Equipment - Tabletop Tripods', color: 2 },
  { name: 'Camera Equipment - Premium Tripods', color: 3 },
  { name: 'Camera Equipment - Video Tripods', color: 4 },
  { name: 'Camera Equipment - Standard Tripods', color: 5 },
  { name: 'Camera Equipment - Budget Tripods', color: 6 },
  { name: 'Camera Equipment - Smartphone Tripods', color: 7 },
  { name: 'Template - Not for Sale', color: 8 }
];

async function findCategoryField() {
  try {
    // List all fields in the table
    const response = await client.bitable.appTableField.list({
      path: {
        app_token: APP_TOKEN,
        table_id: TABLE_ID,
      },
      params: {
        page_size: 100,
      }
    });

    if (!response.data?.items) {
      console.log('No fields found');
      return null;
    }

    console.log('\nAll fields in the table:');
    response.data.items.forEach((field: any) => {
      console.log(`- ${field.field_name} (ID: ${field.field_id}, Type: ${field.type})`);
    });

    // Look for a field that might be a category field
    const categoryField = response.data.items.find(field => {
      const fieldName = field.field_name?.toLowerCase() || '';
      return fieldName.includes('category') || 
             fieldName.includes('カテゴリー') || 
             fieldName.includes('カテゴリ');
    });

    if (categoryField) {
      console.log(`\nFound existing category field: ${categoryField.field_name} (ID: ${categoryField.field_id}, Type: ${categoryField.type})`);
      return categoryField;
    }

    return null;
  } catch (error) {
    console.error('Error finding category field:', error);
    return null;
  }
}

async function createCategoryField() {
  try {
    console.log('Creating new category field...');
    
    const response = await client.bitable.appTableField.create({
      path: {
        app_token: APP_TOKEN,
        table_id: TABLE_ID,
      },
      data: {
        field_name: 'Category',
        type: 3, // 3 is for single select
        property: {
          options: CATEGORIES
        }
      }
    });

    if (response.data?.field) {
      console.log(`Created new category field: ${response.data.field.field_name} (ID: ${response.data.field.field_id})`);
      return response.data.field;
    }
    
    return null;
  } catch (error) {
    console.error('Error creating category field:', error);
    return null;
  }
}

async function updateCategoryField(fieldId: string, fieldName: string) {
  try {
    console.log(`Updating existing category field: ${fieldName}...`);
    
    const response = await client.bitable.appTableField.update({
      path: {
        app_token: APP_TOKEN,
        table_id: TABLE_ID,
        field_id: fieldId,
      },
      data: {
        field_name: fieldName, // Keep the same name
        type: 3, // Single select
        property: {
          options: CATEGORIES
        }
      }
    });

    if (response.code === 0) {
      console.log(`Successfully updated category field with new options`);
      return true;
    } else {
      console.error('Failed to update field:', response);
      return false;
    }
  } catch (error) {
    console.error('Error updating category field:', error);
    return false;
  }
}

async function main() {
  try {
    console.log('Starting category field update process...');
    console.log(`App Token: ${APP_TOKEN}`);
    console.log(`Table ID: ${TABLE_ID}`);
    
    // First, try to find an existing category field
    const existingField = await findCategoryField();
    
    if (existingField) {
      // Check if it's already a single select field (type 3)
      if (existingField.type === 3) {
        console.log('Field is already a single select. Attempting to update options...');
        const success = await updateCategoryField(existingField.field_id!, existingField.field_name!);
        if (success) {
          console.log('\n✅ Successfully updated category field with the following options:');
          CATEGORIES.forEach(cat => console.log(`  - ${cat.name}`));
        } else {
          console.error('❌ Failed to update category field');
        }
      } else {
        console.log(`Field exists but is type ${existingField.type} (not single select).`);
        console.log('Note: You may need to manually delete the existing field and create a new one.');
        console.log('Or use a different field name for the category field.');
        
        // Try creating a new field with a different name
        console.log('\nAttempting to create a new field named "Category"...');
        const newField = await createCategoryField();
        if (newField) {
          console.log('\n✅ Successfully created new category field with the following options:');
          CATEGORIES.forEach(cat => console.log(`  - ${cat.name}`));
        } else {
          console.error('❌ Failed to create new category field');
        }
      }
    } else {
      // Create a new category field
      const newField = await createCategoryField();
      if (newField) {
        console.log('\n✅ Successfully created category field with the following options:');
        CATEGORIES.forEach(cat => console.log(`  - ${cat.name}`));
      } else {
        console.error('❌ Failed to create category field');
      }
    }
    
  } catch (error) {
    console.error('❌ Error in main process:', error);
    process.exit(1);
  }
}

// Run the main function
main();