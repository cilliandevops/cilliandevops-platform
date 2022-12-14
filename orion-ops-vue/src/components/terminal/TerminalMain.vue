<template>
  <div class="terminal-main" :style="{height: terminalHeight, background: this.options.theme.background}">
    <!-- terminal -->
    <div class="terminal-content">
      <div class="terminal" ref="terminal" @contextmenu.prevent="$refs.rightMenu.openRightMenu"></div>
    </div>
    <!-- 事件 -->
    <div class="terminal-event-container">
      <!-- 右键菜单 -->
      <RightClickMenu ref="rightMenu"
                      :x="rightMenuX"
                      :y="rightMenuY"
                      @clickRight="clickRightMenuItem">
        <template #items>
          <a-menu-item key="selectAll">
            <span class="right-menu-item"><a-icon type="profile"/>全选</span>
          </a-menu-item>
          <a-menu-item key="copy">
            <span class="right-menu-item"><a-icon type="copy"/>复制</span>
          </a-menu-item>
          <a-menu-item key="paste">
            <span class="right-menu-item"><a-icon type="snippets"/>粘贴</span>
          </a-menu-item>
          <a-menu-item key="clear">
            <span class="right-menu-item"><a-icon type="stop"/>清空</span>
          </a-menu-item>
          <a-menu-item key="openSearch">
            <span class="right-menu-item"><a-icon type="search"/>搜索</span>
          </a-menu-item>
          <a-menu-item key="toTop">
            <span class="right-menu-item"><a-icon type="vertical-align-top"/>去顶部</span>
          </a-menu-item>
          <a-menu-item key="toBottom">
            <span class="right-menu-item"><a-icon type="vertical-align-bottom"/>去底部</span>
          </a-menu-item>
        </template>
      </RightClickMenu>
      <!-- 搜索框 -->
      <div id="search-card" v-show="search.visible" @keydown.esc="closeSearch">
        <a-card title="搜索" size="small">
          <template #extra>
            <a-icon class="span-blue pointer" type="close" title="关闭" @click="closeSearch"/>
          </template>
          <a-input class="search-input"
                   ref="searchInput"
                   placeholder="请输入查找内容"
                   v-model="search.value"
                   @keyup.enter.native="searchKeywords(true)"
                   allowClear>
          </a-input>
          <div class="search-options">
            <a-row>
              <a-col :span="12">
                <a-checkbox v-model="search.regex">
                  正则匹配
                </a-checkbox>
              </a-col>
              <a-col :span="12">
                <a-checkbox v-model="search.words">
                  单词全匹配
                </a-checkbox>
              </a-col>
              <a-col :span="12">
                <a-checkbox v-model="search.matchCase">
                  区分大小写
                </a-checkbox>
              </a-col>
              <a-col :span="12">
                <a-checkbox v-model="search.incremental">
                  增量查找
                </a-checkbox>
              </a-col>
            </a-row>
          </div>
          <div class="search-buttons">
            <a-button class="terminal-search-button search-button-prev" type="primary" @click="searchKeywords(false)">上一个</a-button>
            <a-button class="terminal-search-button search-button-next" type="primary" @click="searchKeywords(true)">下一个</a-button>
          </div>
        </a-card>
      </div>
    </div>
  </div>
</template>

<script>
import { debounce } from 'lodash'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import { SearchAddon } from 'xterm-addon-search'
import { WebLinksAddon } from 'xterm-addon-web-links'
import { WebglAddon } from 'xterm-addon-webgl'

import 'xterm/css/xterm.css'
import RightClickMenu from '@/components/common/RightClickMenu'

/**
 * 初始化terminal
 */
function initTerminal() {
  // 打开terminal
  this.term = new Terminal(this.options)
  this.term.open(this.$refs.terminal)
  // 注册terminal事件
  this.term.onResize(event => terminalEventHandler.onResize.call(this, event.cols, event.rows))
  this.term.onData(event => terminalEventHandler.onData.call(this, event))
  terminalEventHandler.registerCustomerKey.call(this)

  // 注册自适应组件
  this.plugin.fit = new FitAddon()
  this.term.loadAddon(this.plugin.fit)
  this.plugin.fit.fit()
  // 注册搜索组件
  this.plugin.search = new SearchAddon()
  this.term.loadAddon(this.plugin.search)
  // 注册 url link组件
  if (this.setting.enableWebLink === 1) {
    this.plugin.links = new WebLinksAddon()
    this.term.loadAddon(this.plugin.links)
  }
  // 注册 webgl web加速组件
  if (this.setting.enableWebGL === 1) {
    this.plugin.webgl = new WebglAddon()
    try {
      this.term.loadAddon(this.plugin.webgl)
    } catch (e) {
      console.error('loading addon webgl error', e)
    }
  }

  // 打开websocket
  this.client = new WebSocket(this.$api.terminal({ token: this.setting.accessToken }))
  this.client.onopen = event => {
    clientHandler.onopen.call(this, event)
  }
  this.client.onerror = event => {
    clientHandler.onerror.call(this, event)
  }
  this.client.onclose = event => {
    clientHandler.onclose.call(this, event)
  }
  this.client.onmessage = event => {
    clientHandler.onmessage.call(this, event)
  }
}

/**
 * 终端操作处理器
 */
const terminalEventHandler = {
  onResize(cols, rows) {
    // 调整大小
    terminalOperator.resize.call(this, cols, rows)
  },
  onData(event) {
    // 输入
    terminalOperator.key.call(this, event)
  },
  registerCustomerKey() {
    // 注册自定义按键
    const _this = this
    this.term.attachCustomKeyEventHandler(function(ev) {
      // 注册复制键 ctrl + insert
      // if (ev.keyCode === 45 && ev.ctrlKey && ev.type === 'keydown') {
      //   terminalEventHandler.copy.call(_this)
      // }
      // 注册粘贴键 shift + insert
      // if (ev.keyCode === 45 && ev.shiftKey && ev.type === 'keydown') {
      //   terminalEventHandler.paste.call(_this)
      // }
      // 注册粘贴键 ctrl + shift + v
      // if (ev.keyCode === 86 && ev.ctrlKey && ev.shiftKey && ev.type === 'keydown') {
      //   terminalEventHandler.paste.call(_this)
      // }
      // 注册搜索键 ctrl + shift + f
      if (ev.keyCode === 70 && ev.ctrlKey && ev.shiftKey && ev.type === 'keydown') {
        const visible = _this.search.visible
        _this.search.visible = !visible
        if (!visible) {
          _this.$nextTick(() => {
            _this.$refs.searchInput.focus()
          })
        }
      }
    })
  },
  copy() {
    // 复制
    this.$utils.copyToClipboard(this.term.getSelection())
    this.term.clearSelection()
    this.term.focus()
  },
  paste() {
    // 粘贴
    this.$utils.getClipboardText().then(clipText => {
      terminalOperator.key.call(this, clipText)
      this.term.focus()
    })
  }
}

/**
 * 客户端操作处理器
 */
const clientHandler = {
  onopen() {
    console.log('open')
    this.status = this.$enum.TERMINAL_STATUS.UNAUTHORIZED.value
    this.$emit('initFinish', true)
    // 建立连接
    terminalOperator.connect.call(this)
    // 注册窗口大小监听器
    window.addEventListener('resize', this.debouncedWindowResize)
    // 注册心跳
    const _this = this
    this.pingThread = setInterval(function() {
      terminalOperator.ping.call(_this)
    }, 30000)
  },
  onmessage(e) {
    // 解析协议
    parseProtocol.call(this, e.data)
  },
  onerror() {
    console.log('error')
    this.status = this.$enum.TERMINAL_STATUS.ERROR.value
    this.$emit('initFinish', false)
    this.$message.error('无法连接至服务器', 2)
    this.term.write('\x1B[1;3;31m\r\nfailed to establish connection\x1B[0m')
  },
  onclose(e) {
    console.log('close')
    this.status = this.$enum.TERMINAL_STATUS.DISCONNECTED.value
    this.term.write('\x1B[1;3;31m\r\n' + e.reason + '\x1B[0m')
    // 关闭窗口大小监听器
    window.removeEventListener('resize', this.debouncedWindowResize)
    // 关闭心跳
    if (this.pingThread) {
      clearInterval(this.pingThread)
      this.pingThread = null
    }
  }
}

/**
 * 终端操作
 */
const terminalOperator = {
  connect() {
    console.log('connect')
    // xx|cols|rows|width|height|loginToken
    const width = parseInt(document.getElementsByClassName('terminal')[0].offsetWidth)
    const height = parseInt(document.getElementsByClassName('terminal')[0].offsetHeight)
    const loginToken = this.$storage.get(this.$storage.keys.LOGIN_TOKEN)
    const body = `${this.$enum.TERMINAL_OPERATOR.CONNECT.value}|${this.term.cols}|${this.term.rows}|${width}|${height}|${loginToken}`
    this.client.send(body)
  },
  resize(cols, rows) {
    // 防抖
    if (this.status !== this.$enum.TERMINAL_STATUS.CONNECTED.value) {
      return
    }
    console.log('resize', cols, rows)
    // xx|cols|rows|width|height
    const width = parseInt(document.getElementsByClassName('terminal')[0].offsetWidth)
    const height = parseInt(document.getElementsByClassName('terminal')[0].offsetHeight)
    const body = `${this.$enum.TERMINAL_OPERATOR.RESIZE.value}|${cols}|${rows}|${width}|${height}`
    this.client.send(body)
  },
  key(e) {
    if (this.status !== this.$enum.TERMINAL_STATUS.CONNECTED.value) {
      return
    }
    const body = `${this.$enum.TERMINAL_OPERATOR.KEY.value}|${e}`
    this.client.send(body)
  },
  disconnect() {
    console.log('disconnect')
    this.pingThread && clearInterval(this.pingThread)
    this.client.send(this.$enum.TERMINAL_OPERATOR.DISCONNECT.value)
  },
  ping() {
    console.log('ping')
    this.client.send(this.$enum.TERMINAL_OPERATOR.PING.value)
  }
}

/**
 * 右键菜单操作
 */
const rightMenuHandler = {
  selectAll() {
    this.term.selectAll()
    this.term.focus()
  },
  copy() {
    terminalEventHandler.copy.call(this)
  },
  paste() {
    terminalEventHandler.paste.call(this)
  },
  clear() {
    this.term.clear()
    this.term.clearSelection()
    this.term.focus()
  },
  toTop() {
    this.term.scrollToTop()
    this.term.focus()
  },
  toBottom() {
    this.term.scrollToBottom()
    this.term.focus()
  },
  openSearch() {
    this.search.visible = true
    this.$nextTick(() => {
      this.$refs.searchInput.focus()
    })
  }
}

/**
 * 解析协议
 */
function parseProtocol(msg) {
  if (!this.term) {
    return
  }
  const code = msg.substring(0, 3)
  const len = msg.length
  switch (code) {
    case this.$enum.WS_PROTOCOL.ACK.value:
      this.status = this.$enum.TERMINAL_STATUS.UNAUTHORIZED.value
      this.term.focus()
      break
    case this.$enum.WS_PROTOCOL.CONNECTED.value:
      this.status = this.$enum.TERMINAL_STATUS.CONNECTED.value
      this.term.focus()
      break
    case this.$enum.WS_PROTOCOL.OK.value:
      this.term.write(msg.substring(4, len))
      break
    default:
      console.log(this.$enum.valueOf(this.$enum.WS_PROTOCOL, code).label)
      break
  }
}

export default {
  name: 'TerminalMain',
  components: { RightClickMenu },
  props: {
    machineId: Number,
    terminalHeight: String,
    rightMenuX: {
      type: Function,
      default: e => e.offsetX + 10
    },
    rightMenuY: {
      type: Function,
      default: e => e.offsetY + 80
    }
  },
  data: function() {
    return {
      term: null,
      client: null,
      plugin: {
        fit: null,
        search: null,
        links: null,
        webgl: null
      },
      search: {
        visible: false,
        value: '',
        regex: false,
        words: false,
        matchCase: false,
        incremental: false
      },
      status: 0,
      pingThread: null,
      setting: {
        accessToken: null,
        enableWebLink: 2,
        enableWebGL: 2
      },
      options: {
        cursorStyle: 'bar',
        cursorBlink: true,
        fastScrollModifier: 'shift',
        fontSize: 14,
        rendererType: 'canvas',
        fontFamily: 'courier-new, courier, monospace',
        theme: {
          foreground: '#FFFFFF',
          background: '#212529'
        }
      },
      debouncedWindowResize: debounce(this.fitTerminal, 150)
    }
  },
  watch: {
    status(e) {
      this.$emit('terminalStatusChange', e)
    }
  },
  methods: {
    initTerminal(options, setting) {
      this.options.fontSize = options.fontSize || this.options.fontSize
      this.options.fontFamily = options.fontFamily || this.options.fontFamily
      this.options.theme.foreground = options.fontColor || this.options.theme.foreground
      this.options.theme.background = options.backgroundColor || this.options.theme.background
      this.setting.accessToken = setting.accessToken
      this.setting.enableWebLink = setting.enableWebLink
      this.setting.enableWebGL = setting.enableWebGL
      initTerminal.call(this)
    },
    fitTerminal() {
      this.plugin.fit.fit()
      this.term.resize(this.term.cols, this.term.rows)
    },
    clickRightMenuItem(key) {
      rightMenuHandler[key].call(this)
    },
    writerCommand(command) {
      if (command) {
        terminalOperator.key.call(this, command)
      }
    },
    closeSearch() {
      this.search.visible = false
      this.search.value = ''
      this.term.focus()
    },
    disconnect() {
      terminalOperator.disconnect.call(this)
    },
    searchKeywords(direction) {
      if (!this.search.value) {
        return
      }
      const option = {
        regex: this.search.regex,
        wholeWord: this.search.words,
        caseSensitive: this.search.matchCase,
        incremental: this.search.incremental
      }
      let res
      if (direction) {
        res = this.plugin.search.findNext(this.search.value, option)
      } else {
        res = this.plugin.search.findPrevious(this.search.value, option)
      }
      if (!res) {
        this.$message.info('未查询到匹配项', 0.3)
      }
    }
  }
}
</script>

<style lang="less" scoped>

.terminal-main {
  background: #212529;
  width: 100%;

  .terminal-content {
    height: 100%;

    .terminal {
      height: 100%;
    }
  }
}

#search-card {
  position: fixed;
  top: 94px;
  right: 20px;
  z-index: 200;
  width: 290px;

  .search-input {
    width: 260px;
  }

  .search-options {
    margin: 12px 0;
  }

  .search-buttons {
    margin-top: 5px;
    display: flex;
    justify-content: flex-end;
  }

  .terminal-search-button {
    margin-left: 10px;
  }
}

</style>
