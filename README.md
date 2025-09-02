# Tbox MCP 服务器

基于 Model Context Protocol (MCP) 的 CLI 服务。可以连接到百宝箱智能体。

## 使用方法

```json
{
  "servers": {
    "[工具名称]": {
      "type": "stdio",
      "command": "tnpx",
      "args": ["@mscststs/mcp-tbox-agent"],
      "env": {
        "TBOX_AUTHORIZATION_TOKEN": "********",
        "TBOX_APP_ID": "*******"
      }
    }
  }
}
```

## 如何获取 TBOX_AUTHORIZATION_TOKEN

1. 登录 [百宝箱](https://tbox.cn/)
2. 进入开放平台 - 授权管理 - 创建令牌
