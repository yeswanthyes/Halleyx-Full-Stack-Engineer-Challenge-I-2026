import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../connection';
import { Workflow } from './Workflow';

interface StepAttributes {
  id: string;
  workflow_id: string;
  name: string;
  step_type: 'task' | 'approval' | 'notification';
  order: number;
  metadata: any;
  created_at?: Date;
  updated_at?: Date;
}

interface StepCreationAttributes extends Optional<StepAttributes, 'id' | 'metadata'> {}

export class Step extends Model<StepAttributes, StepCreationAttributes> implements StepAttributes {
  declare id: string;
  declare workflow_id: string;
  declare name: string;
  declare step_type: 'task' | 'approval' | 'notification';
  declare order: number;
  declare metadata: any;

  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

Step.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    workflow_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'workflows',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    step_type: {
      type: DataTypes.ENUM('task', 'approval', 'notification'),
      allowNull: false,
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {},
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'steps',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);
