<template>
  <q-table
    :rows="errata"
    :columns="columns"
    :row-key="(row) => `${row.id}-${row.platform_id}`"
    hide-pagination
    flat
    :rows-per-page-options="[0]"
    no-data-label="No errata found for the release packages"
  >
    <template v-slot:body="props">
      <q-tr :props="props">
        <q-td key="release" :props="props">
          <q-checkbox
            v-model="props.row.release"
            :disable="viewOnly || !props.row.ready"
            size="xs"
          >
            <q-tooltip v-if="!props.row.ready">
              Errata can't be released with this release
            </q-tooltip>
          </q-checkbox>
        </q-td>
        <q-td key="id" :props="props">
          <router-link
            :to="{
              path: '/errata',
              query: {id: props.row.id, platform_id: props.row.platform_id},
            }"
          >
            {{ props.row.id }}
          </router-link>
        </q-td>
        <q-td key="title" :props="props" class="text-wrap">
          {{ props.row.title }}
        </q-td>
        <q-td key="release_status" :props="props">
          <q-chip
            dense
            :color="statusColor(props.row.release_status)"
            class="text-capitalize"
          >
            {{ props.row.release_status }}
          </q-chip>
        </q-td>
        <q-td key="packages" :props="props" class="text-wrap">
          <template v-if="props.row.missing_packages.length">
            <q-icon name="warning" color="warning" size="xs" />
            Missing {{ props.row.missing_packages.length }} of
            {{ props.row.packages_count }}:
            <div
              v-for="pkg in props.row.missing_packages"
              :key="pkg"
              class="text-caption"
            >
              {{ pkg }}
            </div>
          </template>
          <template v-else>
            All {{ props.row.packages_count }} packages are covered
          </template>
        </q-td>
      </q-tr>
    </template>
  </q-table>
</template>

<script>
  import {defineComponent} from 'vue'
  import {ErrataReleaseStatus} from 'src/constants'

  export default defineComponent({
    props: {
      errata: Array,
      viewOnly: Boolean,
    },
    data() {
      return {
        columns: [
          {name: 'release', label: 'Release', align: 'left', field: 'release'},
          {
            name: 'id',
            label: 'ID',
            align: 'left',
            field: 'id',
            sortable: true,
          },
          {name: 'title', label: 'Title', align: 'left', field: 'title'},
          {
            name: 'release_status',
            label: 'Status',
            align: 'left',
            field: 'release_status',
          },
          {
            name: 'packages',
            label: 'Packages',
            align: 'left',
            field: 'missing_packages',
          },
        ],
      }
    },
    methods: {
      statusColor(status) {
        const key = Object.keys(ErrataReleaseStatus.text).find(
          (name) => ErrataReleaseStatus.text[name] === status
        )
        return ErrataReleaseStatus.color[key]
      },
    },
  })
</script>
