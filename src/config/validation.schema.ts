import * as Joi from 'joi';
import { plainToClass } from 'class-transformer';
import { validateSync } from 'class-validator';
import { IsString, IsNumber, IsBoolean, IsOptional, ValidateNested, IsArray, IsUrl } from 'class-validator';
import { Type } from 'class-transformer';

// Config validation classes
export class NodeConfig {
  @IsString()
  name: string;

  @IsNumber()
  port: number;

  @IsString()
  dataDir: string;

  @IsString()
  logLevel: string;
}

export class BlockchainConfig {
  @IsString()
  network: string;

  @IsString()
  @IsUrl()
  rpcUrl: string;

  @IsString()
  registryContractAddress: string;

  @IsString()
  @IsOptional()
  privateKey?: string;
}

export class RegistryConfig {
  @IsString()
  @IsUrl()
  serviceEndpoint: string;

  @IsNumber()
  refreshInterval: number;
}

export class SecurityConfig {
  @IsString()
  encryptionType: string;

  @IsNumber()
  keyRotationPeriod: number;

  @IsBoolean()
  tlsEnabled: boolean;

  @IsString()
  @IsOptional()
  tlsCert?: string;

  @IsString()
  @IsOptional()
  tlsKey?: string;
}

export class MongoDBConfig {
  @IsString()
  @IsOptional()
  uri?: string;

  @IsString()
  database: string;
}

export class StorageConfig {
  @IsString()
  type: string;

  @ValidateNested()
  @Type(() => MongoDBConfig)
  @IsOptional()
  mongodb?: MongoDBConfig;
}

export class AgentsConfig {
  @IsArray()
  @IsString({ each: true })
  defaultCapabilities: string[];

  @IsBoolean()
  autoDiscovery: boolean;

  @IsNumber()
  handshakeTimeout: number;

  @IsNumber()
  maxConcurrentRequests: number;
}

export class CommunicationConfig {
  @IsString()
  protocol: string;

  @IsString()
  messageFormat: string;

  @IsNumber()
  maxMessageSizeBytes: number;

  @IsBoolean()
  compression: boolean;
}

export class TasksConfig {
  @IsNumber()
  maxTTL: number;

  @IsNumber()
  maxHops: number;

  @IsNumber()
  stateCheckpointFrequency: number;
}

export class VcSchemasConfig {
  @IsString()
  @IsUrl()
  AgentCredential: string;

  @IsString()
  @IsUrl()
  CapabilityCredential: string;
}

export class CredentialsConfig {
  @IsNumber()
  defaultExpiryDays: number;

  @ValidateNested()
  @Type(() => VcSchemasConfig)
  vcSchemas: VcSchemasConfig;
}

export class AppConfig {
  @ValidateNested()
  @Type(() => NodeConfig)
  node: NodeConfig;

  @ValidateNested()
  @Type(() => BlockchainConfig)
  blockchain: BlockchainConfig;

  @ValidateNested()
  @Type(() => RegistryConfig)
  registry: RegistryConfig;

  @ValidateNested()
  @Type(() => SecurityConfig)
  security: SecurityConfig;

  @ValidateNested()
  @Type(() => StorageConfig)
  storage: StorageConfig;

  @ValidateNested()
  @Type(() => AgentsConfig)
  agents: AgentsConfig;

  @ValidateNested()
  @Type(() => CommunicationConfig)
  communication: CommunicationConfig;

  @ValidateNested()
  @Type(() => TasksConfig)
  tasks: TasksConfig;

  @ValidateNested()
  @Type(() => CredentialsConfig)
  credentials: CredentialsConfig;
}

// Joi schema for environment variable validation
export const validationSchema = Joi.object({
  P3AI_NODE_NAME: Joi.string(),
  P3AI_PORT: Joi.number().default(3000),
  P3AI_DATA_DIR: Joi.string().default('./data'),
  P3AI_LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
  
  P3AI_BLOCKCHAIN_NETWORK: Joi.string().valid('arbitrum', 'arbitrum-goerli').default('arbitrum'),
  P3AI_RPC_URL: Joi.string().uri().required(),
  P3AI_REGISTRY_CONTRACT: Joi.string().required(),
  P3AI_PRIVATE_KEY: Joi.string().optional(),
  
  P3AI_REGISTRY_ENDPOINT: Joi.string().uri(),
  P3AI_REGISTRY_REFRESH: Joi.number(),
  
  P3AI_ENCRYPTION_TYPE: Joi.string(),
  P3AI_KEY_ROTATION_PERIOD: Joi.number(),
  P3AI_TLS_ENABLED: Joi.boolean().default(false),
  P3AI_TLS_CERT: Joi.string().when('P3AI_TLS_ENABLED', {
    is: true,
    then: Joi.required(),
  }),
  P3AI_TLS_KEY: Joi.string().when('P3AI_TLS_ENABLED', {
    is: true,
    then: Joi.required(),
  }),
  
  P3AI_STORAGE_TYPE: Joi.string().valid('level', 'mongodb').default('level'),
  P3AI_MONGODB_URI: Joi.string().uri().when('P3AI_STORAGE_TYPE', {
    is: 'mongodb',
    then: Joi.required(),
  }),
  P3AI_MONGODB_DB: Joi.string().when('P3AI_STORAGE_TYPE', {
    is: 'mongodb',
    then: Joi.required(),
  }),
  
  P3AI_DEFAULT_CAPABILITIES: Joi.string(),
  P3AI_AUTO_DISCOVERY: Joi.boolean(),
  P3AI_HANDSHAKE_TIMEOUT: Joi.number(),
  P3AI_MAX_CONCURRENT_REQUESTS: Joi.number(),
  
  P3AI_COMM_PROTOCOL: Joi.string().valid('http', 'https', 'ws', 'wss').default('https'),
  P3AI_MESSAGE_FORMAT: Joi.string().valid('json', 'cbor').default('json'),
  P3AI_MAX_MESSAGE_SIZE: Joi.number(),
  P3AI_COMPRESSION: Joi.boolean(),
  
  P3AI_TASK_MAX_TTL: Joi.number(),
  P3AI_TASK_MAX_HOPS: Joi.number(),
  P3AI_STATE_CHECKPOINT_FREQ: Joi.number(),
  
  P3AI_DEFAULT_EXPIRY_DAYS: Joi.number(),
  P3AI_AGENT_CREDENTIAL_SCHEMA: Joi.string().uri(),
  P3AI_CAPABILITY_CREDENTIAL_SCHEMA: Joi.string().uri(),
});

// Function to validate configuration object
export function validateConfig(config: Record<string, any>) {
  const validatedConfig = plainToClass(AppConfig, config);
  const errors = validateSync(validatedConfig, { skipMissingProperties: false });
  
  if (errors.length > 0) {
    throw new Error(`Configuration validation failed: ${errors.toString()}`);
  }
  
  return validatedConfig;
}