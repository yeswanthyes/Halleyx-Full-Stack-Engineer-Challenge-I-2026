"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Rule = void 0;
const sequelize_1 = require("sequelize");
const connection_1 = require("../connection");
class Rule extends sequelize_1.Model {
}
exports.Rule = Rule;
Rule.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    step_id: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'steps',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    condition: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    next_step_id: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'steps',
            key: 'id',
        },
        onDelete: 'SET NULL',
    },
    priority: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    },
}, {
    sequelize: connection_1.sequelize,
    tableName: 'rules',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});
