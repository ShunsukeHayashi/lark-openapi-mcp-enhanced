#!/usr/bin/env node

/**
 * Script to add admin permission for a user to a Lark Base
 * 
 * This script will:
 * 1. Get the user ID from email address
 * 2. List roles in the base to find the admin role
 * 3. Add the user as a member of the admin role
 */

import * as lark from '@larksuiteoapi/node-sdk';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(__dirname, '../.env') });

// Configuration
const APP_TOKEN = 'U38Xbik32acfCBsEbmmjm0NupRe';
const USER_EMAIL = 'hayashi.s@customercloud.ai';

// Initialize Lark client
const client = new lark.Client({
  appId: process.env.APP_ID!,
  appSecret: process.env.APP_SECRET!,
  domain: lark.Domain.Feishu,
  loggerLevel: lark.LoggerLevel.debug,
});

async function getUserIdFromEmail(email: string): Promise<string | null> {
  try {
    console.log(`Getting user ID for email: ${email}`);
    
    const response = await client.contact.user.batchGetId({
      data: {
        emails: [email]
      },
      params: {
        user_id_type: 'open_id'
      }
    });

    if (response.data?.user_list && response.data.user_list.length > 0) {
      const user = response.data.user_list[0];
      console.log(`Found user: ${user.user_id} (status: ${user.status?.is_activated ? 'active' : 'inactive'})`);
      return user.user_id || null;
    }
    
    console.log('User not found');
    return null;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
}

async function listBaseRoles(appToken: string) {
  try {
    console.log(`\nListing roles for base: ${appToken}`);
    
    const response = await client.bitable.appRole.list({
      path: {
        app_token: appToken
      },
      params: {
        page_size: 100
      }
    });

    if (response.data?.items) {
      console.log(`Found ${response.data.items.length} roles:`);
      response.data.items.forEach(role => {
        console.log(`- ${role.role_name} (ID: ${role.role_id})`);
      });
      return response.data.items;
    }
    
    return [];
  } catch (error: any) {
    console.error('Error listing roles:', error);
    if (error.response?.data) {
      console.error('API Response:', JSON.stringify(error.response.data, null, 2));
    }
    return [];
  }
}

async function addUserToRole(appToken: string, roleId: string, userId: string) {
  try {
    console.log(`\nAdding user ${userId} to role ${roleId}`);
    
    const response = await client.bitable.appRoleMember.create({
      path: {
        app_token: appToken,
        role_id: roleId
      },
      data: {
        member_id: userId
      },
      params: {
        member_id_type: 'open_id'
      }
    });

    if (response.code === 0) {
      console.log('User successfully added to role!');
      return true;
    } else {
      console.error('Failed to add user to role:', response.msg);
      return false;
    }
  } catch (error) {
    console.error('Error adding user to role:', error);
    return false;
  }
}

async function main() {
  console.log('=== Lark Base Admin Permission Script ===\n');

  // Step 1: Get user ID from email
  const userId = await getUserIdFromEmail(USER_EMAIL);
  if (!userId) {
    console.error('Failed to get user ID. Exiting.');
    process.exit(1);
  }

  // Step 2: List roles in the base
  const roles = await listBaseRoles(APP_TOKEN);
  if (roles.length === 0) {
    console.error('No roles found in the base. Exiting.');
    process.exit(1);
  }

  // Step 3: Find admin role (usually has highest permissions)
  // Look for role with name containing "admin", "管理", or "owner"
  let adminRole = roles.find(role => 
    role.role_name?.toLowerCase().includes('admin') ||
    role.role_name?.includes('管理') ||
    role.role_name?.toLowerCase().includes('owner') ||
    role.role_name?.toLowerCase().includes('全部')
  );

  // If no admin role found by name, use the first role (often the default admin role)
  if (!adminRole && roles.length > 0) {
    console.log('\nNo role with admin/owner in name found. Using the first role (usually the default admin role).');
    adminRole = roles[0];
  }

  if (!adminRole || !adminRole.role_id) {
    console.error('Could not find a suitable admin role. Exiting.');
    process.exit(1);
  }

  console.log(`\nSelected role: ${adminRole.role_name} (ID: ${adminRole.role_id})`);

  // Step 4: Add user to the admin role
  const success = await addUserToRole(APP_TOKEN, adminRole.role_id, userId);
  
  if (success) {
    console.log('\n✅ Successfully added admin permission!');
    console.log(`User ${USER_EMAIL} now has ${adminRole.role_name} role in base ${APP_TOKEN}`);
  } else {
    console.error('\n❌ Failed to add admin permission');
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});