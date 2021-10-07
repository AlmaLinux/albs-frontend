<template>
  <q-dialog position="top"
            :content-css="{minWidth: '35vw'}"
            v-model="opened">
    <q-card style="width: 550px;">
      <q-card-section class="bg-primary">
        <div class="text-h6 text-white" style="text-align: center;">Add mock options to the build</div>
      </q-card-section>
      <q-card-section style="width: 450px; padding-left: 100px;">
        <div>
          <div class="row no-wrap group">
            <q-input v-model="macroInput.name"
                     :rules="[val => rpmMacroName(val) || 'Invalid macro name']"
                     label="Macro Name" clearable autogrow
                     style="width: 100px;">
            </q-input>
            <q-input v-model="macroInput.value"
                     label="Macro Value" clearable autogrow
                     style="margin-left: 20px; width: 100px;"></q-input>
            <q-btn icon="add" v-if="macroInput.name && macroInput.value" flat @click="onAddMacro"
                   small color="primary" rounded style="margin-left: 20px" size="15px"></q-btn>
          </div>
          <q-list v-if="Object.keys(mock_options.definitions).length" dense highlight no-border>
            <q-item v-for="macro in mock_options.definitions" :key="macro.name" dense>
              <q-item-section style="font-size: 12pt; letter-spacing: 1pt;">
                --define '{{ macro.name }} {{ macro.value }}'
              </q-item-section>
              <q-item-section side style="margin-left: -10px;">
                <q-btn @click="onDeleteMacro(macro.name)"
                       color="negative" flat small icon="delete"/>
                </q-item-section>
              </q-item>
            </q-list>
        </div>

        <q-select v-model="mock_options.with" label="With" use-chips hide-dropdown-icon
                  :rules="[val => rpmMacroName(val) || 'Invalid mock option']"
                  new-value-mode="add-unique" use-input multiple clearable></q-select>
        <q-select v-model="mock_options.without" label="Without" use-chips hide-dropdown-icon
                  :rules="[val => rpmMacroName(val) || 'Invalid mock option']"
                  new-value-mode="add-unique" use-input multiple clearable></q-select>
        <q-select v-model="mock_options.yum_exclude" label="Yum Exclude" use-chips hide-dropdown-icon
                  :rules="[val => yumExcludeName(val) || 'Invalid mock option']"
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
          <q-btn label="Add options" color="primary" icon-right="done" @click="submitMockOpt"></q-btn>
        </q-card-actions>
      </q-card-section>

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
    yumExcludeName (name) {
      return !!/^[\wd\-.*?]{3,}$/.exec(name)
    },
    open() {
      this.opened = true
    },
    close() {
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
      if (this.mock_options.with.length) {
        value.with = []
        for (let w of this.mock_options.with) {
          value.with.push(w)
        }
      }
      if (this.mock_options.yum_exclude.length) {
        value.yum_exclude = []
        for (let exclude of this.mock_options.yum_exclude) {
          value.yum_exclude.push(exclude)
        }
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
