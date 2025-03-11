import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService
  extends PrismaClient<
    Prisma.PrismaClientOptions,
    'query' | 'info' | 'warn' | 'error'
  >
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(private configService: ConfigService) {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
      ],
    });

    // Set up loggers for Prisma events
    if (configService.get('app.debug')) {
      this.$on('query', (e: Prisma.QueryEvent) => {
        this.logger.debug(`Query: ${e.query}`);
        this.logger.debug(`Duration: ${e.duration}ms`);
      });

      this.$on('info', (e: Prisma.LogEvent) => {
        this.logger.log(`Prisma info: ${e.message}`);
      });

      this.$on('warn', (e: Prisma.LogEvent) => {
        this.logger.warn(`Prisma warn: ${e.message}`);
      });
    }

    this.$on('error', (e: Prisma.LogEvent) => {
      this.logger.error(`Prisma error: ${e.message}`);
    });
  }

  async onModuleInit() {
    this.logger.log('Connecting to database...');
    await this.$connect();
    this.logger.log('Connected to database');
  }

  async onModuleDestroy() {
    this.logger.log('Disconnecting from database...');
    await this.$disconnect();
    this.logger.log('Disconnected from database');
  }

  /**
   * Helper function to safely create a record with catching and logging unique constraint errors
   * @param modelName Name of the Prisma model
   * @param data Data to create
   * @param errorMessage Custom error message
   * @returns Created record
   */
  async safeCreate(
    modelName: string,
    data: any,
    errorMessage?: string,
  ): Promise<any> {
    try {
      return await this[modelName].create({ data });
    } catch (error) {
      if (error.code === 'P2002') {
        // Unique constraint violation
        const target = error.meta?.target || 'field';
        this.logger.warn(
          `Unique constraint violation on ${modelName}.${target}`,
        );
        throw new Error(
          errorMessage || `A record with this ${target} already exists`,
        );
      }
      throw error;
    }
  }

  /**
   * Run database cleanup tasks (e.g., expired records)
   * @returns Number of records cleaned up
   */
  async runCleanupTasks(): Promise<{ [key: string]: number }> {
    const now = new Date();
    const results = {
      keyValueStore: 0,
      encryptionKeys: 0,
    };

    // Delete expired key-value entries
    const deletedKV = await this.keyValueStore.deleteMany({
      where: {
        ttl: {
          not: null,
          lt: now,
        },
      },
    });
    results.keyValueStore = deletedKV.count;

    // Mark expired encryption keys as inactive
    const updatedKeys = await this.encryptionKey.updateMany({
      where: {
        expiresAt: {
          not: null,
          lt: now,
        },
        active: true,
      },
      data: {
        active: false,
      },
    });
    results.encryptionKeys = updatedKeys.count;

    return results;
  }

  /**
   * Create an audit log entry
   * @param action Action performed
   * @param entityType Type of entity
   * @param entityId ID of the entity
   * @param userId User ID (if available)
   * @param metadata Additional metadata
   * @param ipAddress IP address
   * @param userAgent User agent
   */
  async createAuditLog(
    action: string,
    entityType: string,
    entityId: string,
    userId?: string,
    metadata?: any,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    try {
      await this.auditLog.create({
        data: {
          action,
          entityType,
          entityId,
          userId,
          metadata,
          ipAddress,
          userAgent,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to create audit log: ${error.message}`);
    }
  }
}
