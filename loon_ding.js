/**
 * 固定伪装脚本：Host = gw.alicdn.com，X-T5-Auth = 683556433
 * 适用于 Loon 的 custom 类型代理
 * 建议文件名：loon_bd_fixed.js
 * 使用方式（Loon 配置中）：
 * [Proxy]
 * 阿里固定伪装 = custom, 163.177.17.6, 443, script-path=https://raw.githubusercontent.com/hanlong3446/loon/refs/heads/main/loon_ding.js
 */

let HTTP_STATUS_INVALID = -1;
let HTTP_STATUS_CONNECTED = 0;
let HTTP_STATUS_WAITRESPONSE = 1;
let HTTP_STATUS_FORWARDING = 2;
var httpStatus = HTTP_STATUS_INVALID;

// 固定伪装参数
const FAKE_HOST = "gw.alicdn.com";
const FAKE_PORT = 443;
const FIXED_AUTH = 683556433;

function tunnelDidConnected() {
  console.log($session);
  if ($session.proxy.isTLS) {
    // https
  } else {
    // http
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
    return null; // 不转发握手响应
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

// 写入伪装 HTTP CONNECT 请求头
function _writeHttpHeader() {
  const realTargetHost = $session.conHost;
  const realTargetPort = $session.conPort;

  const header =
    `CONNECT ${realTargetHost}:${realTargetPort} HTTP/1.1\r\n` +
    `Host: ${FAKE_HOST}:${FAKE_PORT}\r\n` +
    `X-T5-Auth: ${FIXED_AUTH}\r\n` +
    `Proxy-Connection: keep-alive\r\n\r\n`;

  $tunnel.write($session, header);
}
