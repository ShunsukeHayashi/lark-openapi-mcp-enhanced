#!/usr/bin/env node

/**
 * Script to add admin permission for a user to a Lark Base using Drive API
 * 
 * This script will:
 * 1. Get the user ID from email address
 * 2. Add the user with full_access permission to the base
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
  loggerLevel: lark.LoggerLevel.error,
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

async function addPermissionToBitable(appToken: string, userId: string) {
  try {
    console.log(`\nAdding full_access permission for user ${userId} to bitable ${appToken}`);
    
    const response = await client.drive.permissionMember.create({
      path: {
        token: appToken
      },
      data: {
        member_type: 'openid',
        member_id: userId,
        perm: 'full_access'
      },
      params: {
        type: 'bitable',
        need_notification: true
      }
    });

    if (response.code === 0) {
      console.log('Permission successfully added!');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      return true;
    } else {
      console.error('Failed to add permission:', response.msg);
      if (response.code === 400102) {
        console.log('Note: The user may already have access to this base.');
      }
      return false;
    }
  } catch (error: any) {
    console.error('Error adding permission:', error);
    if (error.response?.data) {
      console.error('API Response:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

async function listCurrentPermissions(appToken: string) {
  try {
    console.log(`\nListing current permissions for bitable ${appToken}:`);
    
    const response = await client.drive.permissionMember.list({
      path: {
        token: appToken
      },
      params: {
        type: 'bitable',
        fields: '*'
      }
    });

    if (response.data?.items) {
      console.log(`Found ${response.data.items.length} members:`);
      response.data.items.forEach((member: any) => {
        console.log(`- ${member.name || member.member_id} (${member.member_type}): ${member.perm} permission`);
      });
    }
  } catch (error) {
    console.error('Error listing permissions:', error);
  }
}

async function main() {
  console.log('=== Lark Base Admin Permission Script (Using Drive API) ===\n');

  // Step 1: Get user ID from email
  const userId = await getUserIdFromEmail(USER_EMAIL);
  if (!userId) {
    console.error('Failed to get user ID. Exiting.');
    process.exit(1);
  }

  // Step 2: List current permissions (optional)
  await listCurrentPermissions(APP_TOKEN);

  // Step 3: Add user with full_access permission
  const success = await addPermissionToBitable(APP_TOKEN, userId);
  
  if (success) {
    console.log('\n✅ Successfully added admin permission!');
    console.log(`User ${USER_EMAIL} now has full_access permission to base ${APP_TOKEN}`);
    
    // List permissions again to confirm
    await listCurrentPermissions(APP_TOKEN);
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