/**
 * 本脚本实现HTTP代理协议，用于Loon的自定义协议（custom类型）
 * 使用方式：
 * [Proxy]
 *钉钉免流广州 = custom, 163.177.17.6, 443, script-path=https://raw.githubusercontent.com/hanlong3446/loon/refs/heads/main/loon_ding.js
 * 
 * 本版本专为伪装Host为 gw.alicdn.com 定制
 * author : 星璃（修改 by ChatGPT）
 */

/**
 * 本脚本实现钉钉免流伪装协议，使用 Loon 自定义 custom 类型
 * 固定伪装：
 * - Host: 153.3.236.22:443
 * - X-T5-Auth: 683556433
 * - With-At: gw.alicdn.com
 */

let STATUS_NONE = -1, STATUS_CONNECTED = 0, STATUS_WAITRESP = 1, STATUS_FORWARD = 2;
var status = STATUS_NONE;

// 固定免流字段（根据你给的配置）
const FLOW_HOST = "153.3.236.22";
const FLOW_PORT = 443;
const FLOW_AUTH = 683556433;
const FLOW_WITHAT = "gw.alicdn.com";

function tunnelDidConnected() {
  log(">> connected:", $session.conHost, $session.conPort);
  sendHeader();
  status = STATUS_CONNECTED;
  return true;
}

function tunnelTLSFinished() {
  log("👍 tls finished, send header");
  sendHeader();
  status = STATUS_CONNECTED;
  return true;
}

function tunnelDidWrite() {
  if (status === STATUS_CONNECTED) {
    log("→ write header ok, waiting response...");
    status = STATUS_WAITRESP;
    $tunnel.readTo($session, "\r\n\r\n");
    return false;  // 拦截 header 写回
  }
  return true;
}

function tunnelDidRead(data) {
  if (status === STATUS_WAITRESP) {
    log("✅ handshake OK, start forwarding");
    status = STATUS_FORWARD;
    $tunnel.established($session);
    return null;  // 不转发握手数据
  }
  if (status === STATUS_FORWARD) return data;
}

function tunnelDidClose() { return true; }

function sendHeader() {
  const target = `${$session.conHost}:${$session.conPort}`;
  const header =
    `CONNECT ${target} HTTP/1.1\r\n` +
    `Host: ${FLOW_HOST}:${FLOW_PORT}\r\n` +
    `X-T5-Auth: ${FLOW_AUTH}\r\n` +
    `With-At: ${FLOW_WITHAT}\r\n` +
    `Proxy-Connection: keep-alive\r\n\r\n`;
  log("→ sending header:\n" + header);
  $tunnel.write($session, header);
}

function log() {
  console.log.apply(console, arguments);
}
