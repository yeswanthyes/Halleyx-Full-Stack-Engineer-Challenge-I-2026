import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../connection';
import { Step } from './Step';

interface RuleAttributes {
  id: string;
  step_id: string;
  condition: string;
  next_step_id?: string | null;
  priority: number;
  created_at?: Date;
  updated_at?: Date;
}

interface RuleCreationAttributes extends Optional<RuleAttributes, 'id' | 'next_step_id'> {}

export class Rule extends Model<RuleAttributes, RuleCreationAttributes> implements RuleAttributes {
  declare id: string;
  declare step_id: string;
  declare condition: string;
  declare next_step_id: string | null;
  declare priority: number;

  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

Rule.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    step_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'steps',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    condition: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    next_step_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'steps',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    priority: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
  },
  {
    sequelize,
    tableName: 'rules',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);
