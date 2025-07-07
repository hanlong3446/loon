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
 * - With-At: tms.dingtalk.com
 */

let STATUS_NONE = -1, STATUS_CONNECTED = 0, STATUS_WAIT_RESP = 1, STATUS_FORWARD = 2;
let status = STATUS_NONE;

const FLOW_HOST = '153.3.236.22';
const FLOW_PORT = 443;
const FLOW_AUTH = 683556433;
const FLOW_WITHAT = 'tms.dingtalk.com';

function tunnelDidConnected() {
  sendHeader();
  status = STATUS_CONNECTED;
  return true;
}

function tunnelTLSFinished() {
  sendHeader();
  status = STATUS_CONNECTED;
  return true;
}

function tunnelDidWrite() {
  if (status === STATUS_CONNECTED) {
    status = STATUS_WAIT_RESP;
    $tunnel.readTo($session, "\r\n\r\n");
    return false;
  }
  return true;
}

function tunnelDidRead(data) {
  if (status === STATUS_WAIT_RESP) {
    status = STATUS_FORWARD;
    $tunnel.established($session);
    return null;
  }
  if (status === STATUS_FORWARD) return data;
}

function tunnelDidClose() {
  return true;
}

function sendHeader() {
  const target = `${$session.conHost}:${$session.conPort}`;
  const header =
    `CONNECT ${target} HTTP/1.1\r\n` +
    `Host: ${FLOW_HOST}:${FLOW_PORT}\r\n` +
    `X-T5-Auth: ${FLOW_AUTH}\r\n` +
    `With-At: ${FLOW_WITHAT}\r\n` +
    `Proxy-Connection: keep-alive\r\n\r\n`;
  $tunnel.write($session, header);
}
