<template>
  <ace ref="editor"
       :value="value"
       :lang="lang"
       :width="width === 0 ? '100%' : width"
       :height="height === 0 ? '100%' : height"
       :theme="theme"
       :options="options"
       @init="initEditor"
       v-bind="config">
  </ace>
</template>

<script>

import ace from 'vue2-ace-editor'

export default {
  name: 'Editor',
  components: {
    ace
  },
  props: {
    value: {
      type: String,
      default: ''
    },
    width: {
      type: Number,
      default: 0
    },
    height: {
      type: Number,
      default: 0
    },
    readOnly: {
      type: Boolean,
      default: false
    },
    theme: {
      type: String,
      default: 'iplastic'
    },
    lang: {
      type: String,
      default: 'sh'
    },
    config: {
      type: Object,
      default: () => {
        return {
          enableLiveAutocompletion: true,
          fontSize: 16
        }
      }
    }
  },
  computed: {
    options() {
      return {
        enableBasicAutocompletion: true,
        enableSnippets: true,
        showPrintMargin: false,
        fontSize: this.config.fontSize,
        enableLiveAutocompletion: this.config.enableLiveAutocompletion,
        readOnly: this.readOnly
      }
    }
  },
  methods: {
    initEditor(editor) {
      require('brace/ext/language_tools')
      // 设置语言
      require('brace/mode/sh')
      require('brace/mode/json')
      require('brace/mode/xml')
      require('brace/mode/yaml')
      require('brace/mode/properties')
      require('brace/snippets/sh')
      require('brace/snippets/json')
      require('brace/snippets/xml')
      require('brace/snippets/yaml')
      require('brace/snippets/properties')
      // 设置主题
      // 浅色 iplastic sqlserver tomorrow xcode
      // 深色 dracula gruvbox idle_fingers merbivore terminal tomorrow_night_bright
      require('brace/theme/iplastic')
      // 监听值的变化
      editor.getSession().on('change', () => {
        this.$emit('change', editor.getValue())
      })
    },
    getValue() {
      return this.$refs.editor.editor.getValue()
    },
    setValue(value) {
      this.$refs.editor.editor.session.setValue(value)
    },
    clear() {
      this.$refs.editor.editor.session.setValue('')
    }
  }
}
</script>

<style scoped>

</style>
