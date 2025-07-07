/**
 * 本脚本实现HTTP代理协议，用于Loon的自定义协议（custom类型）
 * 使用方式：
 * [Proxy]
 * 阿里伪装 = custom, 163.177.17.6, 443, script-path=https://raw.githubusercontent.com/hanlong3446/loon/refs/heads/main/loon_ding.js
 * 
 * 本版本专为伪装Host为 gw.alicdn.com 定制
 * author : 星璃（修改 by ChatGPT）
 */

let HTTP_STATUS_INVALID = -1;
let HTTP_STATUS_CONNECTED = 0;
let HTTP_STATUS_WAITRESPONSE = 1;
let HTTP_STATUS_FORWARDING = 2;
var httpStatus = HTTP_STATUS_INVALID;

// 伪装域名
const FAKE_HOST = "gw.alicdn.com";
const FAKE_PORT = 443;

// 构造 X-T5-Auth 验证值
function createVerify(address) {
  let index = 0;
  for (let i = 0; i < address.length; i++) {
    index = (index * 1318293 & 0x7FFFFFFF) + address.charCodeAt(i);
  }
  if (index < 0) {
    index = index & 0x7FFFFFFF;
  }
  return index;
}

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
    return null; // 不转发握手数据
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

// 写入混淆的HTTP CONNECT头
function _writeHttpHeader() {
  const realTargetHost = $session.conHost;
  const realTargetPort = $session.conPort;
  const verify = createVerify(FAKE_HOST);

  const header =
    `CONNECT ${realTargetHost}:${realTargetPort} HTTP/1.1\r\n` +
    `Host: ${FAKE_HOST}:${FAKE_PORT}\r\n` +
    `X-T5-Auth: ${verify}\r\n` +
    `Proxy-Connection: keep-alive\r\n\r\n`;

  $tunnel.write($session, header);
}
