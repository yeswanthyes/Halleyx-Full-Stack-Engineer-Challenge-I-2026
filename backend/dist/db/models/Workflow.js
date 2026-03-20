"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Workflow = void 0;
const sequelize_1 = require("sequelize");
const connection_1 = require("../connection");
class Workflow extends sequelize_1.Model {
}
exports.Workflow = Workflow;
Workflow.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    version: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 1,
        allowNull: false,
    },
    is_active: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
    },
    input_schema: {
        type: sequelize_1.DataTypes.JSON,
        defaultValue: {},
        allowNull: false,
    },
    start_step_id: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
    },
}, {
    sequelize: connection_1.sequelize,
    tableName: 'workflows',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});
