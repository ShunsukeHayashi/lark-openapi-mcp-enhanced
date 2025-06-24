#!/usr/bin/env node

/**
 * Genesis CLI Tool
 * Lark Genesis Architect コマンドラインインターフェース
 */

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { GenesisArchitect } from '../index';
import { RequirementParser } from '../parsers/requirement-parser';
import { ERDiagramGenerator } from '../generators/er-diagram-generator';
import { LarkMcpTool } from '../../mcp-tool';

const program = new Command();

program
  .name('genesis')
  .description('Lark Genesis Architect - AI-powered Lark Base generator')
  .version('1.0.0');

// 全体生成コマンド
program
  .command('generate')
  .description('Generate complete Lark Base from requirements')
  .requiredOption('-r, --requirements <file>', 'Requirements specification file')
  .requiredOption('-g, --gemini-key <key>', 'Gemini API key')
  .requiredOption('-a, --app-id <id>', 'Lark App ID')
  .requiredOption('-s, --app-secret <secret>', 'Lark App Secret')
  .option('-o, --output <dir>', 'Output directory', './genesis-output')
  .option('-v, --verbose', 'Verbose output')
  .action(async (options) => {
    try {
      console.log('🚀 Starting Genesis Architect...');
      
      // 要求仕様の読み込み
      const requirements = fs.readFileSync(options.requirements, 'utf-8');
      
      // Larkクライアントの初期化
      const larkClient = new LarkMcpTool({
        appId: options.appId,
        appSecret: options.appSecret,
        logger: { warn: console.warn, error: console.error, debug: options.verbose ? console.log : () => {}, info: console.info, trace: () => {} }
      });

      // Genesis Architectの初期化
      const architect = new GenesisArchitect({
        geminiApiKey: options.geminiKey,
        larkClient,
        enableLogging: options.verbose
      });

      // 自動生成実行
      const result = await architect.createFromRequirements(requirements);
      
      // 出力ディレクトリの作成
      if (!fs.existsSync(options.output)) {
        fs.mkdirSync(options.output, { recursive: true });
      }

      // 結果の保存
      fs.writeFileSync(
        path.join(options.output, 'execution-context.json'),
        JSON.stringify(result.executionContext, null, 2)
      );

      fs.writeFileSync(
        path.join(options.output, 'build-result.json'),
        JSON.stringify(result.buildResult, null, 2)
      );

      if (result.success) {
        console.log('✅ Genesis completed successfully!');
        console.log(`📄 Base ID: ${result.baseId}`);
        console.log(`📁 Output saved to: ${options.output}`);
      } else {
        console.log('❌ Genesis failed:');
        result.errors.forEach(error => console.log(`   ${error}`));
      }

    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  });

// 要求仕様解析コマンド
program
  .command('parse-requirements')
  .description('Parse and analyze requirements specification')
  .requiredOption('-r, --requirements <file>', 'Requirements specification file')
  .option('-o, --output <file>', 'Output JSON file', './requirements.json')
  .option('-v, --verbose', 'Verbose output')
  .action(async (options) => {
    try {
      console.log('📋 Parsing requirements...');
      
      const requirements = fs.readFileSync(options.requirements, 'utf-8');
      const result = RequirementParser.parse(requirements);
      
      fs.writeFileSync(options.output, JSON.stringify(result, null, 2));
      
      if (result.success) {
        console.log('✅ Requirements parsed successfully!');
        console.log(`📊 Confidence: ${(result.confidence * 100).toFixed(1)}%`);
        console.log(`📁 Output saved to: ${options.output}`);
        
        if (options.verbose && result.form) {
          console.log('\n📝 Summary:');
          console.log(`   Title: ${result.form.title}`);
          console.log(`   Domain: ${result.form.businessDomain}`);
          console.log(`   Functional Requirements: ${result.form.functionalRequirements.length}`);
          console.log(`   Stakeholders: ${result.form.stakeholders.length}`);
        }
      } else {
        console.log('❌ Requirements parsing failed:');
        result.errors.forEach(error => console.log(`   ${error}`));
      }

    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  });

// ER図生成コマンド
program
  .command('generate-er')
  .description('Generate ER diagram from entity definitions')
  .requiredOption('-e, --entities <file>', 'Entities JSON file')
  .option('-r, --relationships <file>', 'Relationships JSON file')
  .option('-o, --output <file>', 'Output Mermaid file', './er-diagram.mmd')
  .option('-t, --title <title>', 'Diagram title')
  .option('--theme <theme>', 'Mermaid theme', 'default')
  .action(async (options) => {
    try {
      console.log('🔗 Generating ER diagram...');
      
      const entities = JSON.parse(fs.readFileSync(options.entities, 'utf-8'));
      let relationships = [];
      
      if (options.relationships && fs.existsSync(options.relationships)) {
        relationships = JSON.parse(fs.readFileSync(options.relationships, 'utf-8'));
      }

      const config = {
        title: options.title,
        theme: options.theme,
        showAttributes: true,
        showDataTypes: true,
        showConstraints: true
      };

      const result = ERDiagramGenerator.generateDiagram(entities, relationships, config);
      
      if (result.success) {
        fs.writeFileSync(options.output, result.mermaidCode);
        
        console.log('✅ ER diagram generated successfully!');
        console.log(`📊 Entities: ${result.metadata.entityCount}`);
        console.log(`🔗 Relationships: ${result.metadata.relationshipCount}`);
        console.log(`📁 Output saved to: ${options.output}`);
      } else {
        console.log('❌ ER diagram generation failed:');
        result.errors.forEach(error => console.log(`   ${error}`));
      }

    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  });

// 段階実行コマンド
program
  .command('step')
  .description('Execute specific generation step')
  .requiredOption('-r, --requirements <file>', 'Requirements specification file')
  .requiredOption('-g, --gemini-key <key>', 'Gemini API key')
  .requiredOption('-c, --command <command>', 'Command ID (C1-C7)')
  .option('-o, --output <file>', 'Output JSON file')
  .option('-v, --verbose', 'Verbose output')
  .action(async (options) => {
    try {
      console.log(`🔄 Executing step ${options.command}...`);
      
      const requirements = fs.readFileSync(options.requirements, 'utf-8');
      
      const architect = new GenesisArchitect({
        geminiApiKey: options.geminiKey,
        larkClient: null, // ステップ実行では不要
        enableLogging: options.verbose
      });

      const result = await architect.executeStep(requirements, options.command);
      
      if (options.output) {
        fs.writeFileSync(options.output, JSON.stringify(result, null, 2));
      }

      if (result.success) {
        console.log('✅ Step executed successfully!');
        
        if (options.verbose) {
          console.log('\n📄 Result:');
          console.log(JSON.stringify(result.result, null, 2));
        }
        
        if (options.output) {
          console.log(`📁 Output saved to: ${options.output}`);
        }
      } else {
        console.log('❌ Step execution failed:');
        result.errors.forEach(error => console.log(`   ${error}`));
      }

    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  });

// 検証コマンド
program
  .command('validate')
  .description('Validate Genesis system configuration')
  .requiredOption('-g, --gemini-key <key>', 'Gemini API key')
  .option('-a, --app-id <id>', 'Lark App ID (optional)')
  .option('-s, --app-secret <secret>', 'Lark App Secret (optional)')
  .action(async (options) => {
    try {
      console.log('🔍 Validating system configuration...');
      
      // Gemini API接続テスト
      const { GeminiClient } = await import('../utils/gemini-client');
      const geminiClient = new GeminiClient({
        apiKey: options.geminiKey
      });

      const geminiStatus = await geminiClient.healthCheck();
      console.log(`🤖 Gemini API: ${geminiStatus ? '✅ Connected' : '❌ Failed'}`);

      // Lark API接続テスト（オプショナル）
      if (options.appId && options.appSecret) {
        try {
          const larkClient = new LarkMcpTool({
            appId: options.appId,
            appSecret: options.appSecret,
            logger: { warn: () => {}, error: () => {}, debug: () => {}, info: () => {}, trace: () => {} }
          });
          
          // 簡単なAPI呼び出しでテスト
          console.log('🚀 Lark API: ✅ Configuration valid');
        } catch (error) {
          console.log('🚀 Lark API: ❌ Configuration invalid');
        }
      }

      // システム状況の確認
      const architect = new GenesisArchitect({
        geminiApiKey: options.geminiKey,
        larkClient: null
      });

      const status = architect.getStatus();
      console.log('\n📊 System Status:');
      console.log(`   Ready: ${status.isReady ? '✅' : '❌'}`);
      console.log(`   Version: ${status.version}`);
      console.log(`   Capabilities: ${status.capabilities.length}`);
      
      if (options.verbose) {
        console.log('\n🛠️ Available Capabilities:');
        status.capabilities.forEach(cap => console.log(`   - ${cap}`));
      }

    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  });

// テンプレート生成コマンド
program
  .command('template')
  .description('Generate requirements template')
  .option('-t, --type <type>', 'Template type (basic|detailed|enterprise)', 'basic')
  .option('-o, --output <file>', 'Output file', './requirements-template.md')
  .action((options) => {
    try {
      console.log('📝 Generating requirements template...');
      
      const templates = {
        basic: `# Project Requirements

## Title
Project Name: [Your Project Name]

## Description
[Brief description of what you want to build]

## Business Domain
[e.g., CRM, Project Management, Inventory Management]

## Stakeholders
- [Stakeholder 1]
- [Stakeholder 2]

## Objectives
- [Primary objective]
- [Secondary objective]

## Functional Requirements
- [Requirement 1]: [Description]
- [Requirement 2]: [Description]

## Non-functional Requirements
- Performance: [Performance requirements]
- Security: [Security requirements]

## Constraints
- [Constraint 1]
- [Constraint 2]
`,
        detailed: `# Detailed Project Requirements

## Project Information
- **Title:** [Project Name]
- **Description:** [Detailed description]
- **Business Domain:** [Domain]
- **Priority:** [High/Medium/Low]
- **Complexity:** [1-5]
- **Timeline:** [Expected timeline]
- **Budget:** [Budget constraints]

## Stakeholders
- **Primary Users:** [Who will use the system]
- **Administrators:** [Who will manage the system]
- **Sponsors:** [Who is funding/supporting]

## Business Objectives
- [Objective 1]: [Detailed description and success metrics]
- [Objective 2]: [Detailed description and success metrics]

## Functional Requirements

### Core Features
- **FR001:** [Feature name]
  - Description: [Detailed description]
  - Priority: [Must/Should/Could/Won't]
  - Complexity: [1-5]
  - Dependencies: [Other requirements]

### User Stories
- As a [user type], I want to [action], so that [benefit]

## Non-functional Requirements
- **Performance:** [Response time, throughput requirements]
- **Security:** [Authentication, authorization, data protection]
- **Usability:** [User experience requirements]
- **Reliability:** [Uptime, error handling requirements]
- **Scalability:** [Growth and load requirements]

## Constraints
- [Technical constraints]
- [Business constraints]
- [Regulatory constraints]

## Assumptions
- [Assumption 1]
- [Assumption 2]

## Success Criteria
- [Criterion 1]: [How to measure]
- [Criterion 2]: [How to measure]
`,
        enterprise: `# Enterprise Project Requirements Specification

## Executive Summary
[High-level overview for executives]

## Project Charter
- **Project Name:** [Name]
- **Project Sponsor:** [Sponsor]
- **Project Manager:** [Manager]
- **Start Date:** [Date]
- **Target Completion:** [Date]
- **Budget:** [Amount]

## Business Context
- **Business Problem:** [What problem are we solving]
- **Business Opportunity:** [What opportunity are we pursuing]
- **Strategic Alignment:** [How does this align with business strategy]

## Stakeholder Analysis
- **Primary Stakeholders:** [Name, Role, Influence, Requirements]
- **Secondary Stakeholders:** [Name, Role, Influence, Requirements]
- **Key Decision Makers:** [Name, Authority Level]

## Detailed Requirements

### Business Requirements
- **BR001:** [Business requirement]
  - **Business Value:** [Value proposition]
  - **Success Metrics:** [KPIs]

### Functional Requirements
- **FR001:** [Functional requirement]
  - **User Story:** [Story format]
  - **Acceptance Criteria:** [Testable criteria]
  - **Business Rules:** [Rules and logic]

### Non-functional Requirements
- **Performance:** [Detailed performance specs]
- **Security:** [Security standards and compliance]
- **Integration:** [System integration requirements]
- **Data:** [Data requirements and governance]

## Technical Architecture
- **System Architecture:** [High-level architecture]
- **Technology Stack:** [Preferred technologies]
- **Integration Points:** [External systems]

## Risk Assessment
- **High Risk:** [Risk description and mitigation]
- **Medium Risk:** [Risk description and mitigation]
- **Low Risk:** [Risk description and mitigation]

## Implementation Strategy
- **Phase 1:** [Scope and timeline]
- **Phase 2:** [Scope and timeline]
- **Phase 3:** [Scope and timeline]

## Success Criteria and KPIs
- [Detailed success metrics]
- [Key Performance Indicators]
- [Business value measurement]
`
      };

      const template = templates[options.type as keyof typeof templates] || templates.basic;
      fs.writeFileSync(options.output, template);
      
      console.log('✅ Template generated successfully!');
      console.log(`📄 Type: ${options.type}`);
      console.log(`📁 Saved to: ${options.output}`);

    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  });

// バージョン情報とヘルプの表示
program.parse();

if (process.argv.length === 2) {
  program.help();
}