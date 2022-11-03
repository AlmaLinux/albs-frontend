<template>
  <q-card-section class="q-pl-md mock">
    <q-list v-if="mock_options.definitions" dense highlight no-border>
      <q-scroll-area
        :style="scrollStyle(Object.keys(mock_options.definitions).length)"
      >
        <q-item
          v-for="name in Object.keys(mock_options.definitions)"
          :key="name"
          dense
        >
          <q-item-section class="mock-options">
            <span>
              <b>--define</b> '{{ name }} {{ mock_options.definitions[name] }}'
            </span>
          </q-item-section>
        </q-item>
      </q-scroll-area>
    </q-list>
    <q-field
      v-if="mock_options.target_arch"
      label="--target"
      stack-label
      class="q-pa-sm cursor-pointer"
      @focus="copyMock('target_arch', mock_options.target_arch)"
    >
      <template v-slot:control>
        <div
          class="self-center full-width no-outline mock-options"
          tabindex="0"
        >
          <span class="q-pl-md"> '{{ mock_options.target_arch }}' </span>
        </div>
      </template>
    </q-field>
    <q-field
      v-if="mock_options.with"
      label="--with"
      stack-label
      class="q-pa-sm cursor-pointer"
      @focus="copyMock('with', mock_options.with)"
    >
      <template v-slot:control>
        <div class="self-center full-width no-outline" tabindex="0">
          <template v-for="mock_with in mock_options.with" :key="mock_with">
            <q-chip color="primary" text-color="white">
              {{ mock_with }}
            </q-chip>
          </template>
        </div>
      </template>
    </q-field>
    <q-field
      v-if="mock_options.without"
      label="--without"
      stack-label
      class="q-pa-sm cursor-pointer"
      @focus="copyMock('without', mock_options.without)"
    >
      <template v-slot:control>
        <div class="self-center full-width no-outline" tabindex="0">
          <template
            v-for="mock_without in mock_options.without"
            :key="mock_without"
          >
            <q-chip color="primary" text-color="white">
              {{ mock_without }}
            </q-chip>
          </template>
        </div>
      </template>
    </q-field>
    <q-field
      v-if="mock_options.yum_exclude"
      label="Yum Exclude"
      stack-label
      class="q-pa-sm cursor-pointer"
      @focus="copyMock('yum_exclude', mock_options.yum_exclude)"
    >
      <template v-slot:control>
        <div class="self-center full-width no-outline" tabindex="0">
          <template
            v-for="yum_exclude in mock_options.yum_exclude"
            :key="yum_exclude"
          >
            <q-chip color="primary" text-color="white">
              {{ yum_exclude }}
            </q-chip>
          </template>
        </div>
      </template>
    </q-field>
    <q-field
      v-if="mock_options.module_enable"
      label="Enable Modules"
      stack-label
      class="q-pa-sm cursor-pointer"
      @focus="copyMock('module_enable', mock_options.module_enable)"
    >
      <template v-slot:control>
        <div class="self-center full-width no-outline" tabindex="0">
          <template
            v-for="module_enable in mock_options.module_enable"
            :key="module_enable"
          >
            <q-chip color="primary" text-color="white">
              {{ module_enable }}
            </q-chip>
          </template>
        </div>
      </template>
    </q-field>
  </q-card-section>
</template>

<script>
  import {defineComponent} from 'vue'
  import {copyToClipboard} from '../utils'

  export default defineComponent({
    props: {
      mock_options: Object,
    },
    methods: {
      copyMock(mock, value) {
        let copyOption = ''
        switch (mock) {
          case 'with':
            copyOption = `--with '${value.join(' ')}'`
            break
          case 'without':
            copyOption = `--without '${value.join(' ')}'`
            break
          case 'yum_exclude':
            copyOption = `--x '${value.join(' ')}'`
            break
          case 'target_arch':
            copyOption = `--target '${value}'`
            break
          case 'module_enable':
            copyOption = `enabled modules : ${value.join(' ')}`
            break
          default:
            break
        }
        copyToClipboard(copyOption)
      },
      scrollStyle(length) {
        let style = 'width: 500px;'
        if (length > 2) {
          return style.concat(' height: 250px;')
        } else if (length === 2) {
          return style.concat(' height: 120px;')
        } else {
          return style.concat(' height: 60px;')
        }
      },
    },
  })
</script>

<style scoped>
  .mock-options span {
    padding-bottom: 1em;
    word-break: break-all;
    font-size: 9pt;
    letter-spacing: 1pt;
  }

  .mock {
    font-family: monospace;
  }
</style>
