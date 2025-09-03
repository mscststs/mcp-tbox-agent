#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { chat } from "./chat.js";

class TboxMcpServer {
  constructor() {
    this.server = new Server(
      {
        name: "tbox-mcp-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "chat",
          description: "询问远程的 tbox 智能体",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "问题或者要求",
              },
              userId: {
                type: "string",
                description: "用户ID（可选）",
              },
              conversationId: {
                type: "string",
                description: "会话ID（可选）",
              },
            },
            required: ["query"],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name !== "chat") {
        throw new Error(`Unknown tool: ${request.params.name}`);
      }

      const { query, userId, conversationId } = request.params.arguments;

      const token = process.env.TBOX_AUTHORIZATION_TOKEN;
      const defaultAppId = process.env.TBOX_APP_ID;

      if (!token) {
        throw new Error("环境变量 TBOX_AUTHORIZATION_TOKEN 未设置");
      }

      const finalAppId = defaultAppId;
      if (!finalAppId) {
        throw new Error("未提供appId且环境变量 TBOX_APP_ID 未设置");
      }

      try {
        const response = await chat({
          token: token,
          appId: finalAppId,
          query: query,
          userId: userId,
          conversationId: conversationId,
        });

        return {
          content: [
            {
              type: "text",
              text: response?.text || "",
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `错误: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    // console.error('Tbox MCP服务器已启动');
  }
}

const server = new TboxMcpServer();

server.run().catch(console.error);
