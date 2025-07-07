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

let HTTP_STATUS_INVALID = -1;
let HTTP_STATUS_CONNECTED = 0;
let HTTP_STATUS_WAITRESPONSE = 1;
let HTTP_STATUS_FORWARDING = 2;
var httpStatus = HTTP_STATUS_INVALID;

// 固定免流参数
const FIXED_HOST = "153.3.236.22";
const FIXED_PORT = 443;
const FIXED_AUTH = 683556433;
const FIXED_WITH_AT = "gw.alicdn.com";

function tunnelDidConnected() {
  console.log($session);
  if ($session.proxy.isTLS) {
    // https
  } else {
    _writeHttpHeader();
    httpStatus = HTTP_STATUS_CONNECTED;
  }
  return true;
}

function tunnelTLSFinished() {
  _writeHttpHeader();
  httpStatus = HTTP_STATUS_CONNECTED;
  return true;
}

function tunnelDidRead(data) {
  if (httpStatus === HTTP_STATUS_WAITRESPONSE) {
    console.log('http handshake success');
    httpStatus = HTTP_STATUS_FORWARDING;
    $tunnel.established($session);
    return null;
  } else if (httpStatus === HTTP_STATUS_FORWARDING) {
    return data;
  }
}

function tunnelDidWrite() {
  if (httpStatus === HTTP_STATUS_CONNECTED) {
    console.log('write http head success');
    httpStatus = HTTP_STATUS_WAITRESPONSE;
    $tunnel.readTo($session, '\x0D\x0A\x0D\x0A');
    return false;
  }
  return true;
}

function tunnelDidClose() {
  return true;
}

function _writeHttpHeader() {
  const realTargetHost = $session.conHost;
  const realTargetPort = $session.conPort;

  const header =
    `CONNECT ${realTargetHost}:${realTargetPort} HTTP/1.1\r\n` +
    `Host: ${FIXED_HOST}:${FIXED_PORT}\r\n` +
    `X-T5-Auth: ${FIXED_AUTH}\r\n` +
    `With-At: ${FIXED_WITH_AT}\r\n` +
    `Proxy-Connection: keep-alive\r\n\r\n`;

  $tunnel.write($session, header);
}
