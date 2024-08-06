<template>
  <div class="q-pl-xl row" max-width>
    <div class="q-pa-md" style="width: 40%">
      <div class="q-gutter-md row items-start">
        <q-select
          v-model="platform"
          :options="platforms"
          label="Platform"
          class="col"
          style="width: 5%"
          clearable
        />

        <q-select
          v-model="status"
          :options="statuses"
          label="Status"
          class="col"
          style="width: 5%"
          clearable
        />
      </div>
      <div class="q-py-md q-gutter-md row items-start">
        <q-input
          v-model="id"
          label="Advisory ID"
          class="col"
          @keydown.enter.prevent="searchErrata()"
        />

        <q-input
          v-model="cveId"
          label="CVE ID"
          class="col"
          @keydown.enter.prevent="searchErrata()"
        />
      </div>
      <div class="q-py-md q-gutter-md row items-start">
        <q-input
          v-model="bulletinTitle"
          class="col"
          label="Bulletin title"
          @keydown.enter.prevent="searchErrata()"
        />
      </div>
      <div class="q-pb-md group row justify-end">
        <q-btn
          @click="searchErrata()"
          no-caps
          icon="search"
          color="primary"
          :loading="loading"
        >
          Search
        </q-btn>
      </div>
      <div
        class="q-pb-md group row justify-center"
        style="gap: 10px; margin: 10px"
      >
        <input
          class="date"
          type="datetime-local"
          style="
            border: 1px solid transparent;
            padding: 5px;
            border-radius: 6px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
          "
        />
        <q-btn
          size="80%"
          no-caps
          icon="restart_alt"
          color="grey-8"
          @click="resetErratas()"
          :loading="loadingReset"
        >
          Reset
          <q-tooltip
            >Reset matched packages of erratas issued after a specified date
          </q-tooltip>
        </q-btn>
      </div>
      <q-table
        title="Advisory"
        :rows="advisors"
        :columns="columns"
        color="primary"
        :loading="loadingTable"
        :rows-per-page-options="[10]"
        hide-pagination
        binary-state-sort
        wrap-cells
      >
        <template v-slot:body="props">
          <q-tr
            :props="props"
            class="cursor-pointer"
            :class="markAdvisory(props.row.id)"
            @click="loadAdvisory(props.row.id, props.row.platform_id)"
          >
            <q-td key="release_status" :props="props">
              <q-chip
                :color="statusColor(props.row)"
                text-color="white"
                dense
                class="text-weight-bolder"
                square
              >
                {{ props.row.release_status }}
              </q-chip>
            </q-td>
            <q-td key="updated_date" :props="props">{{
              formatDate(props.row.updated_date)
            }}</q-td>
            <q-td key="id" :props="props">{{ props.row.id }}</q-td>
            <q-td key="platform" :props="props">{{
              platformName(props.row.platform_id)
            }}</q-td>
            <q-td key="original_title" :props="props">{{
              title(props.row)
            }}</q-td>
          </q-tr>
        </template>
      </q-table>
      <div class="row justify-center">
        <q-pagination input :max="totalPages" v-model="currentPage" size="sm" />
      </div>
    </div>

    <div class="q-pa-lg items-start" style="width: 60%">
      <errata-info
        ref="errataInfo"
        :platforms="platforms"
        @updateFeed="loadAdvisories"
        @updatePackages="loadAdvisory"
      />
    </div>
  </div>
</template>

<script>
  import {defineComponent, ref} from 'vue'
  import {Notify} from 'quasar'
  import ErrataInfo from 'components/ErrataInfo.vue'
  import {ErrataReleaseStatus} from 'src/constants'

  export default defineComponent({
    data() {
      return {
        bulletinTitle: '',
        id: '',
        cveId: '',
        status: '',
        platform: null,
        loading: false,
        loadingReset: false,
        loadingTable: false,
        totalPages: ref(1),
        selectedAdvisory: null,
        columns: [
          {
            name: 'release_status',
            required: true,
            align: 'left',
            label: 'Status',
            field: 'release_status',
          },
          {
            name: 'updated_date',
            required: true,
            label: 'Update date',
            align: 'left',
            field: 'updated_date',
            headerStyle: 'width: 120px',
          },
          {
            name: 'id',
            required: true,
            align: 'left',
            label: 'ID',
            field: 'id',
          },
          {
            name: 'platform',
            required: true,
            align: 'left',
            label: 'Platform',
            field: 'platform',
          },
          {
            name: 'original_title',
            required: true,
            align: 'left',
            label: 'Bulletin title',
            field: 'original_title',
          },
        ],
        errataStatuses: ErrataReleaseStatus,
        advisors: [],
      }
    },
    created() {
      this.loadAdvisories({pageNumber: this.errataPageNumber})
      if (this.$route.query.id)
        this.loadAdvisory(this.$route.query.id, this.$route.query.platform_id)
    },
    computed: {
      platforms() {
        return this.$store.state.platforms.platforms.map((platform) => {
          return {
            label: platform.name,
            value: platform.id,
            arch_list: platform.arch_list,
          }
        })
      },
      statuses() {
        return Object.values(this.errataStatuses.text).map((status, _) => {
          return {label: status, value: status}
        })
      },
      errataPageNumber() {
        return this.$store.getters['errataFeed/errataPageNumber']
      },
      currentPage: {
        get() {
          return this.$store.state.errataFeed.pageNumber
        },
        set(value) {
          this.$store.commit('errataFeed/setPageNumber', value)
          this.loadAdvisories()
        },
      },
    },
    methods: {
      searchErrata() {
        this.loading = true
        this.currentPage = 1
      },
      statusColor(record) {
        let col = ''
        switch (record.release_status) {
          case this.errataStatuses.NOT_RELEASED:
            col = 'grey'
            break
          case this.errataStatuses.IN_PROGRESS:
            col = 'primary'
            break
          case this.errataStatuses.RELEASED:
            col = 'green'
            break
          case this.errataStatuses.FAILED:
            col = 'negative'
            break
        }
        return col
      },
      loadAdvisories() {
        let query = {
          title: this.bulletinTitle,
          id: this.id,
          cveId: this.cveId,
          pageNumber: this.errataPageNumber,
        }
        if (this.status) query.status = this.status.value
        if (this.platform) query.platformId = this.platform.value
        this.loadingTable = true
        this.$api
          .get(`/errata/query/`, {params: query})
          .then((response) => {
            this.loading = false
            this.loadingTable = false
            this.advisors = response.data.records
            this.totalPages = Math.ceil(response.data['total_records'] / 10)
          })
          .catch((error) => {
            this.loading = false
            this.loadingTable = false
            Notify.create({
              message: `${error.response.status}: ${error.response.statusText}`,
              type: 'negative',
              actions: [{label: 'Dismiss', color: 'white', handler: () => {}}],
            })
          })
      },
      loadAdvisory(id, platform_id) {
        this.loadingTable = true
        let query = {errata_id: id, errata_platform_id: platform_id}
        this.$api
          .get(`/errata/`, {params: query})
          .then((response) => {
            this.loadingTable = false
            this.selectedAdvisory = response.data
            this.$router.push({
              query: {
                id: this.selectedAdvisory.id,
                platform_id: this.selectedAdvisory.platform_id,
              },
            })
            this.$refs.errataInfo.open(this.selectedAdvisory)
          })
          .catch((error) => {
            console.log(error)
            this.loadingTable = false
            Notify.create({
              message: `Failed to load advisory with id: ${id}`,
              type: 'negative',
              actions: [{label: 'Dismiss', color: 'white', handler: () => {}}],
            })
          })
      },
      resetErratas() {
        const dateInput = document.querySelector('.date')
        if (dateInput.value) {
          const formattedDate = dateInput.value.replace('T', ' ') + ':00'
          console.log(formattedDate)
          this.loadingReset = true
          this.$api
            .post(
              `/errata/reset-matched-packages-multiple?issued_date=${formattedDate}`
            )
            .then((response) => {
              this.loadingReset = false
              Notify.create({
                message: response.data.message,
                type: 'positive',
                actions: [
                  {label: 'Dismiss', color: 'white', handler: () => {}},
                ],
              })
            })
            .catch((error) => {
              console.log(error)
              this.loadingReset = false
              Notify.create({
                message: `${error.response.status}: ${error.response.statusText}`,
                type: 'negative',
                actions: [
                  {label: 'Dismiss', color: 'white', handler: () => {}},
                ],
              })
            })
        } else {
          this.loadingReset = false
          Notify.create({
            message: 'No date has been chosen',
            type: 'negative',
            actions: [{label: 'Dismiss', color: 'white', handler: () => {}}],
          })
        }
      },
      markAdvisory(id) {
        if (this.selectedAdvisory)
          return this.selectedAdvisory.id === id ? 'bg-grey-4' : ''
      },
      formatDate(date) {
        const longEnUSFormatter = new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
        return longEnUSFormatter.format(new Date(date))
      },
      title(advisory) {
        return advisory.title ? advisory.title : advisory.original_title
      },
      platformName(id) {
        return this.platforms.find((platform) => platform.value == id).label
      },
    },
    components: {
      ErrataInfo,
    },
  })
</script>

<style scoped></style>
