<template>
  <q-dialog persistent position="top" v-model="opened" full-height>
    <q-card style="width: 550px;">
      <q-form @submit="submitMockOpt">
        <q-card-section class="bg-primary shadow-2">
          <div class="text-h6 text-white" style="text-align: center;">Add mock options to the build</div>
        </q-card-section>
        <q-card-section style="width: 550px; padding-left: 25px; padding-right: 25px;">
          <div>
            <q-form @submit="onAddMacro" class="q-gutter-md">
              <div class="row no-wrap group">
                <q-input v-model="macroInput.name"
                        :rules="[val => rpmMacroName(val) || 'Invalid macro name']"
                        lazy-rules
                        label="Macro Name" clearable
                        style="width: 242px;">
                </q-input>
                <q-input v-model="macroInput.value"
                        label="Macro Value" clearable
                        style="margin-left: 20px; width: 242px;"></q-input>
                <q-item-section side>
                  <q-btn icon="add" type="submit" v-if="macroInput.name && macroInput.value" flat
                      small color="primary" round style="left: 15px" size="16px"></q-btn>
                  </q-item-section>
              </div>
            </q-form>
            <q-list v-if="Object.keys(mock_options.definitions).length" dense highlight no-border>
              <q-item v-for="macro in mock_options.definitions" :key="macro.name" dense>
                <q-item-section style="font-size: 12pt; letter-spacing: 1pt;">
                  --define '{{ macro.name }} {{ macro.value }}'
                </q-item-section>
                <q-item-section side style="margin-left: -10px;">
                  <q-btn @click="onDeleteMacro(macro.name)"
                        color="negative" flat round small size="16px" icon="delete"/>
                  </q-item-section>
                </q-item>
              </q-list>
          </div>

          <q-select v-model="mock_options.with" label="With" use-chips hide-dropdown-icon input-debounce="0"
                    :rules="[val => mockValue(val) || 'Invalid With value']"
                    new-value-mode="add-unique" use-input multiple clearable></q-select>
          <q-select v-model="mock_options.without" label="Without" use-chips hide-dropdown-icon
                    :rules="[val => mockValue(val) || 'Invalid Without value']"
                    new-value-mode="add-unique" use-input multiple clearable></q-select>
          <q-select v-model="mock_options.yum_exclude" label="Yum Exclude" use-chips hide-dropdown-icon
                    :rules="[val => yumExcludeName(val) || 'Invalid Yum Exclude value']"
                    new-value-mode="add-unique" use-input multiple clearable></q-select>
          <q-select v-model="mock_options.module_enable" label="Enable Modules" use-chips hide-dropdown-icon
                    new-value-mode="add-unique" use-input multiple clearable>
            <q-tooltip anchor="bottom middle" self="top middle" :delay="1000">
                Enable specified modules (only for CL8 and later). The following
                forms are supported:<br/>
                <ul>
                  <li>NAME</li>
                  <li>NAME:STREAM</li>
                  <li>NAME:STREAM:VERSION</li>
                  <li>NAME:STREAM:VERSION:CONTEXT</li>
                  <li>all above combinations with /PROFILE (e.g. NAME/PROFILE)</li>
                </ul>
              </q-tooltip>
          </q-select>

          <q-input v-model="mock_options.target_arch" label="Target Arch" clearable autogrow hint="--target">
            <q-tooltip anchor="bottom middle" self="top middle" :delay="1000">
              Mock --target option, see https://linux.die.net/man/1/mock (--target section)
              for additional info.
            </q-tooltip>
          </q-input>
        </q-card-section>
        <q-card-section>
          <span class="text-tertiary" style="font-size: small;">
            <q-icon name="help_outline" size="1.5em" color="faded"/>
              See the '--define', '--with' and '--without' arguments description
              in a mock manual page.
          </span>
        </q-card-section>
        <q-separator/>
        <q-card-section>
          <q-card-actions align="right">
            <q-btn label="Cancel" v-close-popup flat color="negative" icon="cancel"/>
            <q-btn label="Add options" type="submit" color="primary" icon-right="done"></q-btn>
          </q-card-actions>
        </q-card-section>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script>

import { defineComponent } from 'vue'

export default defineComponent({
  model: {
    prop: 'buildMockOpts', event: 'change'
  },
  props: {
    buildMockOpts: Object
  },
  data () {
    return {
      opened: false,
      mock_options: {
        definitions: [],
        with: [],
        without: [],
        yum_exclude: [],
        module_enable: [],
        target_arch: ''
      },
      macroInput: {
        name: null,
        value: null
      }
    }
  },
  methods: {
    rpmMacroName (name) {
      return !!/^\w{3,}$/.exec(name)
    },
    mockValue (values) {
      var flag = false
      if (values === null){
        values = []
      }
      if (values.length === 0) {
        flag = true
      }
      values.forEach(value => {
        flag = this.rpmMacroName(value)
      })
      return flag
    },
    yumExcludeName (names) {
      var flag = false
      if (names === null){
        names = []
      }
      if (names.length === 0) {
        flag = true
      }
      names.forEach(name => {
        flag = !!/^[\wd\-.*?]{3,}$/.exec(name)
      });
      return flag
    },
    open (options) {
      if (options && Object.keys(options).length > 0) {
        console.log('TEST2:', options)
        this.mock_options = JSON.parse(JSON.stringify(options))
      }
      this.opened = true
    },
    close () {
      this.opened = false
    },
    onAddMacro () {
      const name = this.macroInput.name
      const value = this.macroInput.value
      const idx = this.mock_options.definitions.findIndex(macro => macro.name === name)
      if (idx === -1) {
        this.mock_options.definitions.push({name, value})
      }
      else {
        this.mock_options.definitions[idx].value = value
      }
      this.macroInput.name = null
      this.macroInput.value = null
    },
    onDeleteMacro (name) {
      const idx = this.mock_options.definitions.findIndex(macro => macro.name === name)
      if (idx !== -1) {
        this.mock_options.definitions.splice(idx, 1)
      }
    },
    submitMockOpt () {
      const value = {}
      if (this.mock_options.with === null) {
        this.mock_options.with = []
      }
      if (this.mock_options.with.length) {
        value.with = []
        for (let w of this.mock_options.with) {
          value.with.push(w)
        }
      }
      if (this.mock_options.yum_exclude === null) {
        this.mock_options.yum_exclude = []
      }
      if (this.mock_options.yum_exclude.length) {
        value.yum_exclude = []
        for (let exclude of this.mock_options.yum_exclude) {
          value.yum_exclude.push(exclude)
        }
      }
      if (this.mock_options.without === null) {
        this.mock_options.without = []
      }
      if (this.mock_options.without.length) {
        value.without = []
        for (let wt of this.mock_options.without) {
          value.without.push(wt)
        }
      }
      if (this.mock_options.definitions.length) {
        value.definitions = {}
        for (let macro of this.mock_options.definitions) {
          value.definitions[macro.name] = macro.value
        }
      }
      if (this.mock_options.module_enable === null) {
        this.mock_options.module_enable = []
      }
      if (this.mock_options.module_enable.length) {
        value.module_enable = []
        for (let module of this.mock_options.module_enable) {
          value.module_enable.push(module)
        }
      }
      if (this.mock_options.target_arch && this.mock_options.target_arch.length) {
          value.target_arch = this.mock_options.target_arch
      }
      this.$emit('change', value)
      this.close()
    }
  }
})
</script>


<style scoped>

</style>
