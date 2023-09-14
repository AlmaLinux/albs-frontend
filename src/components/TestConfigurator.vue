<template>
  <div class="justify-center">
    <q-scroll-area style="height: 36vw" class="row">
      <div class="row justify-center">
        <q-table
          style="width: 100%"
          :rows="buildItems"
          :columns="columns"
          row-key="name"
          flat
          dense
          :rows-per-page-options="[0]"
          hide-pagination
        >
          <template v-slot:header="props">
            <q-tr :props="props">
              <q-th v-for="col in props.cols" :key="col.name" :props="props">
                {{ col.label }}
              </q-th>
              <q-th auto-width />
            </q-tr>
          </template>
          <template v-slot:body="props">
            <template v-if="props.row.modules_yaml">
              <q-tr v-for="ref in props.row.refs" :key="ref.git_ref">
                <q-td key="ref">
                  <build-ref :buildRef="ref" />
                </q-td>
                <q-td key="env" class="text-center">
                  <div v-if="!ref.test_env">
                    <span class="text-overline">-</span>
                  </div>
                  <div v-for="(value, key) in ref.test_env" :key="key">
                    <span class="text-weight-regular"> {{ key }}: </span>
                    <span class="text-weight-light"> {{ value }} </span>
                  </div>
                </q-td>
                <q-td class="text-center" key="tests">
                  <div v-if="!ref.tests || ref.tests === 0">
                    <span class="text-overline">-</span>
                  </div>
                  <div v-for="test in ref.tests" :key="test">
                    <a :href="test.url" target="_blank">
                      {{ test.package_name }}
                    </a>
                  </div>
                </q-td>
                <q-td auto-width>
                  <q-btn flat round icon="edit" @click="onEditTest(ref)">
                    <q-tooltip> Configure test</q-tooltip>
                  </q-btn>
                </q-td>
              </q-tr>
            </template>
            <q-tr v-else :props="props">
              <q-td key="ref" :props="props">
                <build-ref :buildRef="props.row" />
              </q-td>
              <q-td key="env" :props="props">
                <div v-if="!props.row.test_env">
                  <span class="text-overline">-</span>
                </div>
                <div v-for="(value, key) in props.row.test_env" :key="key">
                  <span class="text-weight-regular"> {{ key }}: </span>
                  <span class="text-weight-light"> {{ value }} </span>
                </div>
              </q-td>
              <q-td key="tests" :props="props">
                <div v-if="!props.row.tests || props.row.tests === 0">
                  <span class="text-overline">-</span>
                </div>
                <div v-for="test in props.row.tests" :key="test">
                  <a :href="test.url" target="_blank">
                    {{ test.package_name }}
                  </a>
                </div>
              </q-td>
              <q-td auto-width>
                <q-btn flat round icon="edit" @click="onEditTest(props.row)">
                  <q-tooltip> Configure test</q-tooltip>
                </q-btn>
              </q-td>
            </q-tr>
          </template>
        </q-table>
      </div>
    </q-scroll-area>
  </div>

  <test-editor ref="editTest" />
</template>

<script>
  import {defineComponent} from 'vue'
  import BuildRef from 'components/BuildRef.vue'
  import TestEditor from './TestEditor.vue'

  export default defineComponent({
    model: {
      prop: 'buildItems',
    },
    props: {
      buildItems: Array,
    },
    data() {
      return {
        columns: [
          {
            name: 'ref',
            required: true,
            align: 'left',
            label: 'Project',
            field: 'ref',
          },
          {
            name: 'env',
            required: true,
            label: 'ENV',
            align: 'center',
            field: 'env',
          },
          {
            name: 'tests',
            required: true,
            label: 'Tests',
            align: 'center',
            field: 'tests',
          },
        ],
      }
    },
    methods: {
      onEditTest(project) {
        this.$refs.editTest.open(project)
      },
    },
    components: {
      BuildRef,
      TestEditor,
    },
  })
</script>

<style scoped></style>
