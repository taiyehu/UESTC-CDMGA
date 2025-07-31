// 文件路径：src/main/java/com/cdmga/uestc/webpage/common/Result.java
package com.cdmga.uestc.webpage.Common; // 对应上述包路径

public class Result {
    private int code;
    private String message;
    private Object data;

    // 构造方法
    public Result(int code, String message, Object data) {
        this.code = code;
        this.message = message;
        this.data = data;
    }

    // 静态工具方法：成功响应
    public static Result success(Object data) {
        return new Result(0, "操作成功", data);
    }

    // 静态工具方法：失败响应
    public static Result error(String message) {
        return new Result(1, message, null);
    }

    // Getter 和 Setter（必须提供，否则 JSON 序列化会失败）
    public int getCode() {
        return code;
    }

    public void setCode(int code) {
        this.code = code;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Object getData() {
        return data;
    }

    public void setData(Object data) {
        this.data = data;
    }
}
