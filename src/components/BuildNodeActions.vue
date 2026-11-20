<template>
  <div class="row items-center no-wrap q-gutter-xs">
    <q-btn
      v-if="compact"
      flat
      round
      dense
      icon="more_vert"
      :loading="busy === 'drain' || busy === 'enabled'"
      :disable="!!busy"
    >
      <q-tooltip>Manage the node</q-tooltip>
      <q-menu auto-close>
        <q-list dense style="min-width: 190px">
          <q-item clickable @click="onDrainClick">
            <q-item-section avatar>
              <q-icon :name="drainIcon" :color="drainColor" />
            </q-item-section>
            <q-item-section>{{ drainLabel }}</q-item-section>
          </q-item>
          <q-item clickable @click="onEnabledClick">
            <q-item-section avatar>
              <q-icon :name="enabledIcon" :color="enabledColor" />
            </q-item-section>
            <q-item-section>{{ enabledLabel }}</q-item-section>
          </q-item>
          <q-item clickable @click="openCapacityDialog">
            <q-item-section avatar>
              <q-icon name="tune" color="primary" />
            </q-item-section>
            <q-item-section>Slot limit…</q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </q-btn>
    <template v-else>
      <q-btn
        outline
        no-caps
        :color="drainColor"
        :icon="drainIcon"
        :label="drainLabel"
        :loading="busy === 'drain'"
        :disable="!!busy"
        @click="onDrainClick"
      >
        <q-tooltip>{{ drainHint }}</q-tooltip>
      </q-btn>
      <q-btn
        outline
        no-caps
        :color="enabledColor"
        :icon="enabledIcon"
        :label="enabledLabel"
        :loading="busy === 'enabled'"
        :disable="!!busy"
        @click="onEnabledClick"
      />
      <q-btn
        outline
        no-caps
        color="primary"
        icon="tune"
        label="Slot limit"
        :disable="!!busy"
        @click="openCapacityDialog"
      >
        <q-tooltip>Set or reset the manual slot limit</q-tooltip>
      </q-btn>
    </template>

    <q-dialog v-model="confirm.show">
      <q-card style="min-width: 380px; max-width: 520px">
        <q-card-section>
          <div class="text-h6">{{ confirm.title }}</div>
        </q-card-section>
        <q-card-section class="q-pt-none">{{ confirm.message }}</q-card-section>
        <q-card-actions align="right">
          <q-btn flat no-caps label="Cancel" v-close-popup />
          <q-btn
            flat
            no-caps
            color="negative"
            :label="confirm.action"
            v-close-popup
            @click="confirm.onConfirm()"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="capacityDialog">
      <q-card style="min-width: 380px; max-width: 520px">
        <q-form @submit="saveCapacityOverride">
          <q-card-section>
            <div class="text-h6">Slot limit of {{ node.name }}</div>
            <div class="text-caption text-grey-8">
              {{ limit.description }}
              <span v-if="limit.hasOverride">
                The current manual limit is {{ node.capacity_override }}.
              </span>
            </div>
          </q-card-section>
          <q-card-section class="q-pt-none">
            <q-input
              v-model="capacityValue"
              type="number"
              min="0"
              :max="limit.max === null ? undefined : limit.max"
              step="1"
              label="Manual slot limit"
              autofocus
              :hint="capacityHint"
              :rules="[(value) => validateCapacityOverride(value, limit.max)]"
            />
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat no-caps label="Cancel" v-close-popup />
            <q-btn
              v-if="limit.hasOverride"
              flat
              no-caps
              color="orange-9"
              :label="`Reset to ${limit.resetTo}`"
              :loading="busy === 'capacity-reset'"
              :disable="!!busy"
              @click="resetCapacityOverride"
            />
            <q-btn
              flat
              no-caps
              color="primary"
              label="Save"
              type="submit"
              :loading="busy === 'capacity'"
              :disable="!!busy"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
  import {defineComponent} from 'vue'
  import {Notify} from 'quasar'
  import {
    capacityLimitHint,
    capacityLimitInfo,
    describeApiError,
    validateCapacityOverride,
  } from '../buildNodeUtils'

  export default defineComponent({
    name: 'BuildNodeActions',
    props: {
      node: {type: Object, required: true},
      // a single menu button for table rows
      compact: {type: Boolean, default: false},
    },
    emits: ['updated'],
    data() {
      return {
        busy: null,
        confirm: {
          show: false,
          title: '',
          message: '',
          action: '',
          onConfirm: () => {},
        },
        capacityDialog: false,
        capacityValue: null,
      }
    },
    computed: {
      drainLabel() {
        return this.node.drain ? 'Undrain' : 'Drain'
      },
      drainIcon() {
        return this.node.drain ? 'play_circle' : 'pause_circle'
      },
      drainColor() {
        return this.node.drain ? 'primary' : 'orange-9'
      },
      drainHint() {
        return this.node.drain
          ? 'Let the node take new tasks again'
          : 'Finish the current tasks and take no new ones'
      },
      enabledLabel() {
        return this.node.enabled ? 'Disable' : 'Enable'
      },
      enabledIcon() {
        return this.node.enabled ? 'power_settings_new' : 'power'
      },
      enabledColor() {
        return this.node.enabled ? 'negative' : 'green-8'
      },
      limit() {
        return capacityLimitInfo(this.node)
      },
      capacityHint() {
        return capacityLimitHint(this.node, this.capacityValue)
      },
    },
    methods: {
      validateCapacityOverride,
      askConfirmation(title, message, action, onConfirm) {
        this.confirm = {show: true, title, message, action, onConfirm}
      },
      onDrainClick() {
        if (this.node.drain) {
          this.patch({drain: false}, 'drain', 'drain is off')
          return
        }
        let running = this.node.active_tasks_count || 0
        this.askConfirmation(
          `Drain ${this.node.name}?`,
          `The node will finish its ${running} running task(s) and take ` +
            'no new ones until it is undrained.',
          'Drain',
          () => this.patch({drain: true}, 'drain', 'drain is on')
        )
      },
      onEnabledClick() {
        if (!this.node.enabled) {
          this.patch({enabled: true}, 'enabled', 'enabled')
          return
        }
        this.askConfirmation(
          `Disable ${this.node.name}?`,
          'The node will take no new tasks until it is enabled again.',
          'Disable',
          () => this.patch({enabled: false}, 'enabled', 'disabled')
        )
      },
      openCapacityDialog() {
        this.capacityValue = this.limit.initial
        this.capacityDialog = true
      },
      saveCapacityOverride() {
        let value = Number(this.capacityValue)
        if (value === 0) {
          this.askConfirmation(
            `Set the slot limit of ${this.node.name} to 0?`,
            'With a limit of 0 the node takes no tasks until the limit is ' +
              'changed or reset.',
            'Set to 0',
            () => this.setCapacityOverride(0)
          )
          return
        }
        this.setCapacityOverride(value)
      },
      setCapacityOverride(value) {
        this.patch(
          {capacity_override: value},
          'capacity',
          `slot limit set to ${value}`
        ).then((ok) => {
          if (ok) this.capacityDialog = false
        })
      },
      resetCapacityOverride() {
        this.patch(
          {capacity_override: null},
          'capacity-reset',
          'slot limit reset'
        ).then((ok) => {
          if (ok) this.capacityDialog = false
        })
      },
      patch(payload, busyKey, doneText) {
        this.busy = busyKey
        return this.$api
          .patch(`/build_nodes/${this.node.id}`, payload)
          .then((response) => {
            this.$emit('updated', response.data)
            Notify.create({
              message: `${this.node.name}: ${doneText}`,
              type: 'positive',
              actions: [{label: 'Dismiss', color: 'white', handler: () => {}}],
            })
            return true
          })
          .catch((error) => {
            let info = describeApiError(error)
            // 401 and 403 are already reported by the API interceptor
            if (info.kind !== 'forbidden' && info.kind !== 'unauthorized') {
              Notify.create({
                message: `Cannot update ${this.node.name}: ${info.message}`,
                type: 'negative',
                timeout: 10000,
                actions: [
                  {label: 'Dismiss', color: 'white', handler: () => {}},
                ],
              })
            }
            return false
          })
          .finally(() => {
            this.busy = null
          })
      },
    },
  })
</script>
