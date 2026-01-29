import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('stories')
@Index(['hnId'], { unique: true })
@Index(['time'])
@Index(['score'])
@Index(['fetchedAt'])
export class Story {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'hn_id', type: 'integer', unique: true })
  hnId!: number;

  @Column({ type: 'varchar', length: 500 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  url?: string;

  @Column({ type: 'text', nullable: true })
  text?: string;

  @Column({ type: 'integer', default: 0 })
  score!: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  by?: string;

  @Column({ type: 'integer' })
  time!: number;

  @Column({ type: 'integer', default: 0 })
  descendants!: number;

  @Column({ name: 'story_type', type: 'varchar', length: 50, nullable: true })
  storyType?: string;

  @Column({ type: 'boolean', default: false })
  dead!: boolean;

  @Column({ type: 'boolean', default: false })
  deleted!: boolean;

  @CreateDateColumn({ name: 'fetched_at' })
  fetchedAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

@Entity('fetch_logs')
export class FetchLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'started_at', type: 'timestamp' })
  startedAt!: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Column({ name: 'stories_fetched', type: 'integer', default: 0 })
  storiesFetched!: number;

  @Column({ name: 'stories_updated', type: 'integer', default: 0 })
  storiesUpdated!: number;

  @Column({ name: 'stories_new', type: 'integer', default: 0 })
  storiesNew!: number;

  @Column({ type: 'text', nullable: true })
  errors?: string;

  @Column({ type: 'boolean', default: false })
  success!: boolean;
}
