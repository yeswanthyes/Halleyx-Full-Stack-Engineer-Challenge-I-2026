"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Step = void 0;
const sequelize_1 = require("sequelize");
const connection_1 = require("../connection");
class Step extends sequelize_1.Model {
}
exports.Step = Step;
Step.init({
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
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    step_type: {
        type: sequelize_1.DataTypes.ENUM('task', 'approval', 'notification'),
        allowNull: false,
    },
    order: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    metadata: {
        type: sequelize_1.DataTypes.JSON,
        defaultValue: {},
        allowNull: false,
    },
}, {
    sequelize: connection_1.sequelize,
    tableName: 'steps',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});
