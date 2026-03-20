"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Execution = void 0;
const sequelize_1 = require("sequelize");
const connection_1 = require("../connection");
class Execution extends sequelize_1.Model {
}
exports.Execution = Execution;
Execution.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    workflow_id: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'workflows',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    workflow_version: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('pending', 'in_progress', 'completed', 'failed', 'canceled'),
        defaultValue: 'pending',
        allowNull: false,
    },
    data: {
        type: sequelize_1.DataTypes.JSON,
        defaultValue: {},
        allowNull: false,
    },
    logs: {
        type: sequelize_1.DataTypes.JSON,
        defaultValue: [],
        allowNull: false,
    },
    current_step_id: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
    },
    retries: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
    },
    triggered_by: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    started_at: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    ended_at: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
}, {
    sequelize: connection_1.sequelize,
    tableName: 'executions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});
