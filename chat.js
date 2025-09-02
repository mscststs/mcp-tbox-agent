import { TboxClient } from "tbox-nodejs-sdk";
import { v4 } from "uuid";

const generateUserId = () => {
  // 使用 v4 移除-
  return v4().replace(/-/g, "");
};

const userId = generateUserId();

export const chat = async ({ token, appId, query }) => {
  const client = new TboxClient({
    httpClientConfig: {
      authorization: token,
    },
  });

  const stream = client.chat(
    {
      appId: appId,
      query: query,
      userId: userId,
    },
    {
      sseFormat: true,
    }
  );

  const response = await new Promise((resolve, reject) => {
    const messages = [];
    const messageMap = new Map(); // 用于按messageId分组消息

    stream.on("data", ({ data }) => {
      // console.log(data);

      if (data.payload) {
        try {
          const payload = JSON.parse(data.payload);

          // 处理不同类型的消息
          if (data.type === "chunk") {
            if (payload.text) {
              // 按messageId分组，区分不同的消息
              const messageId = payload.messageId || "default";
              if (!messageMap.has(messageId)) {
                messageMap.set(messageId, {
                  text: "",
                  messageId: messageId,
                  conversationId: payload.conversationId,
                  type: "chunk",
                });
              }
              messageMap.get(messageId).text += payload.text;
            }
          } else if (data.type === "header") {
            // 处理header类型的消息
            messages.push({
              type: "header",
              data: payload,
              timestamp: Date.now(),
            });
          } else if (data.type === "meta") {
            // 处理meta类型的消息
            messages.push({
              type: "meta",
              data: payload,
              timestamp: Date.now(),
            });
          } else if (data.type === "thinking") {
            // 处理thinking类型的消息
            messages.push({
              type: "thinking",
              data: payload,
              timestamp: Date.now(),
            });
          }
        } catch (error) {
          console.error("解析payload失败:", error);
        }
      }
    });

    stream.on("end", () => {
      // 将分组后的chunk消息添加到messages数组
      const chunkMessages = Array.from(messageMap.values());
      messages.push(...chunkMessages);

      // 按时间顺序排序（这里简化处理，实际可能需要更复杂的排序）
      messages.sort((a, b) => {
        if (a.timestamp && b.timestamp) return a.timestamp - b.timestamp;
        if (a.type === "chunk" && b.type !== "chunk") return 1;
        if (a.type !== "chunk" && b.type === "chunk") return -1;
        return 0;
      });

      // 使用 ------ 和换行分割不同的message
      const textWithSeparators = Array.from(messageMap.values())
        .map((msg) => msg.text)
        .join("\n------\n");

      resolve({
        text: textWithSeparators,
        messages: messages,
        chunk: textWithSeparators, // 保持向后兼容
      });
    });

    stream.on("error", (err) => {
      reject(err);
    });
  });

  return response;
};
