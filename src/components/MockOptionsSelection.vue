<template>
  <q-dialog
    persistent
    position="top"
    v-model="opened"
    full-height
    style="max-width: 650px"
  >
    <q-card style="width: 650px; max-width: 650px">
      <q-form @submit="submitMockOpt">
        <q-card-section class="bg-primary shadow-2">
          <div class="text-h6 text-white" style="text-align: center">
            Add mock options to the build
          </div>
        </q-card-section>
        <q-card-section style="width: 650px; padding-left: 25px">
          <q-scroll-area style="height: 500px; width: 620px; max-width: 620px">
            <div>
              <q-form @submit="onAddMacro" class="q-gutter-md">
                <div class="row no-wrap group">
                  <q-input
                    v-model="macroInput.name"
                    :rules="[
                      (val) => rpmMacroName(val) || 'Invalid macro name',
                    ]"
                    lazy-rules
                    label="Macro Name"
                    clearable
                    style="width: 262px"
                  >
                  </q-input>
                  <q-input
                    v-model="macroInput.value"
                    label="Macro Value"
                    clearable
                    style="margin-left: 20px; width: 262px"
                  ></q-input>
                  <q-item-section side>
                    <q-btn
                      icon="add"
                      type="submit"
                      v-if="macroInput.name && macroInput.value"
                      flat
                      small
                      color="primary"
                      round
                      style="left: 15px"
                      size="16px"
                    ></q-btn>
                  </q-item-section>
                </div>
              </q-form>
              <q-list
                v-if="Object.keys(mock_options.definitions).length"
                dense
                highlight
                no-border
              >
                <q-scroll-area
                  :style="
                    scrollStyle(Object.keys(mock_options.definitions).length)
                  "
                >
                  <q-item
                    v-for="macro in mock_options.definitions"
                    :key="macro.name"
                    dense
                  >
                    <q-item-section
                      style="font-size: 11pt; letter-spacing: 1pt"
                    >
                      --define '{{ macro.name }} {{ macro.value }}'
                    </q-item-section>
                    <q-item-section side style="margin-left: -10px">
                      <q-btn
                        @click="onDeleteMacro(macro.name)"
                        color="negative"
                        flat
                        round
                        small
                        size="16px"
                        icon="delete"
                      />
                    </q-item-section>
                  </q-item>
                </q-scroll-area>
              </q-list>
            </div>

            <q-select
              v-model="mock_options.with"
              label="With"
              use-chips
              hide-dropdown-icon
              input-debounce="0"
              :rules="[(val) => mockValue(val) || 'Invalid With value']"
              class="q-pr-md"
              new-value-mode="add-unique"
              use-input
              multiple
              clearable
            ></q-select>
            <q-select
              v-model="mock_options.without"
              label="Without"
              use-chips
              hide-dropdown-icon
              :rules="[(val) => mockValue(val) || 'Invalid Without value']"
              class="q-pr-md"
              new-value-mode="add-unique"
              use-input
              multiple
              clearable
            ></q-select>
            <q-select
              v-model="mock_options.yum_exclude"
              label="Yum Exclude"
              use-chips
              hide-dropdown-icon
              :rules="[
                (val) => yumExcludeName(val) || 'Invalid Yum Exclude value',
              ]"
              class="q-pr-md"
              new-value-mode="add-unique"
              use-input
              multiple
              clearable
            ></q-select>
            <q-select
              v-if="!disable_modules"
              v-model="mock_options.module_enable"
              label="Enable Modules"
              use-chips
              hide-dropdown-icon
              new-value-mode="add-unique"
              use-input
              multiple
              clearable
              class="q-pr-md"
            >
              <q-tooltip anchor="bottom middle" self="top middle" :delay="1000">
                Enable specified modules (only for CL8 and later). The following
                forms are supported:<br />
                <ul>
                  <li>NAME</li>
                  <li>NAME:STREAM</li>
                  <li>NAME:STREAM:VERSION</li>
                  <li>NAME:STREAM:VERSION:CONTEXT</li>
                  <li>
                    all above combinations with /PROFILE (e.g. NAME/PROFILE)
                  </li>
                </ul>
              </q-tooltip>
            </q-select>

            <q-input
              v-model="mock_options.target_arch"
              label="Target Arch"
              clearable
              autogrow
              hint="--target"
              class="q-pr-md"
            >
              <q-tooltip anchor="bottom middle" self="top middle" :delay="1000">
                Mock --target option, see https://linux.die.net/man/1/mock
                (--target section) for additional info.
              </q-tooltip>
            </q-input>
          </q-scroll-area>
        </q-card-section>
        <q-card-section>
          <span class="text-tertiary" style="font-size: small">
            <q-icon name="help_outline" size="1.5em" color="faded" />
            See the '--define', '--with' and '--without' arguments description
            in a mock manual page.
          </span>
        </q-card-section>
        <q-separator />
        <q-card-section>
          <q-card-actions align="right">
            <q-btn
              label="Cancel"
              v-close-popup
              flat
              color="negative"
              icon="cancel"
            />
            <q-btn
              label="Add options"
              type="submit"
              color="primary"
              icon-right="done"
            ></q-btn>
          </q-card-actions>
        </q-card-section>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script>
  import {defineComponent} from 'vue'

  export default defineComponent({
    model: {
      prop: 'buildMockOpts',
      event: 'change',
    },
    props: {
      buildMockOpts: Object,
    },
    data() {
      return {
        opened: false,
        mock_options: {
          definitions: [],
          with: [],
          without: [],
          yum_exclude: [],
          module_enable: [],
          target_arch: '',
        },
        macroInput: {
          name: null,
          value: null,
        },
        disable_modules: false,
      }
    },
    methods: {
      rpmMacroName(name) {
        return !!/^\w{3,}$/.exec(name)
      },
      mockValue(values) {
        var flag = false
        if (values === null) {
          values = []
        }
        if (values.length === 0) {
          flag = true
        }
        values.forEach((value) => {
          flag = this.rpmMacroName(value)
        })
        return flag
      },
      yumExcludeName(names) {
        var flag = false
        if (names === null) {
          names = []
        }
        if (names.length === 0) {
          flag = true
        }
        names.forEach((name) => {
          flag = !!/^[\wd\-.*?]{3,}$/.exec(name)
        })
        return flag
      },
      open(mock_options, disable_enabled_modules = false) {
        this.disable_modules = disable_enabled_modules
        if (mock_options.definitions) {
          this.mock_options.definitions = []
          for (const key in mock_options.definitions) {
            this.mock_options.definitions.push({
              name: key,
              value: mock_options.definitions[key],
            })
          }
        } else {
          this.mock_options.definitions = []
        }
        mock_options.with
          ? (this.mock_options.with = mock_options.with)
          : (this.mock_options.with = [])
        mock_options.without
          ? (this.mock_options.without = mock_options.without)
          : (this.mock_options.without = [])
        mock_options.yum_exclude
          ? (this.mock_options.yum_exclude = mock_options.yum_exclude)
          : (this.mock_options.yum_exclude = [])
        mock_options.module_enable
          ? (this.mock_options.module_enable = mock_options.module_enable)
          : (this.mock_options.module_enable = [])
        mock_options.target_arch
          ? (this.mock_options.target_arch = mock_options.target_arch)
          : (this.mock_options.target_arch = '')
        this.opened = true
      },
      close() {
        this.opened = false
      },
      onAddMacro() {
        const name = this.macroInput.name
        const value = this.macroInput.value
        const idx = this.mock_options.definitions.findIndex(
          (macro) => macro.name === name
        )
        if (idx === -1) {
          this.mock_options.definitions.push({name, value})
        } else {
          this.mock_options.definitions[idx].value = value
        }
        this.macroInput.name = null
        this.macroInput.value = null
      },
      onDeleteMacro(name) {
        const idx = this.mock_options.definitions.findIndex(
          (macro) => macro.name === name
        )
        if (idx !== -1) {
          this.mock_options.definitions.splice(idx, 1)
        }
      },
      submitMockOpt() {
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
        if (
          this.mock_options.target_arch &&
          this.mock_options.target_arch.length
        ) {
          value.target_arch = this.mock_options.target_arch
        }
        this.$emit('change', value)
        this.close()
      },
      scrollStyle(length) {
        let style = 'width: 600px; max-width: 650px;'
        if (length > 2) {
          return style.concat(' height: 150px;')
        } else if (length === 2) {
          return style.concat(' height: 120px;')
        } else {
          return style.concat(' height: 60px;')
        }
      },
    },
  })
</script>

<style scoped></style>
