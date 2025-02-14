<template>
  <template v-if="expand">
    <q-expansion-item :icon="icon" :label="title" v-if="allow">
      <q-item
        clickable
        tag="a"
        class="q-pl-xl"
        v-for="child in children"
        :key="child.title"
        :href="child.link"
        :id="child.id"
      >
        <q-item-section v-if="child.icon" avatar>
          <q-icon :name="child.icon" />
        </q-item-section>

        <q-item-section>
          <q-item-label>{{ child.title }}</q-item-label>
          <q-item-label caption>
            {{ child.caption }}
          </q-item-label>
        </q-item-section>
      </q-item>
    </q-expansion-item>
  </template>
  <template v-else>
    <q-item clickable tag="a" :href="link" v-if="allow">
      <q-item-section v-if="icon" avatar>
        <q-icon :name="icon" />
      </q-item-section>

      <q-item-section>
        <q-item-label>{{ title }}</q-item-label>
        <q-item-label caption>
          {{ caption }}
        </q-item-label>
      </q-item-section>
    </q-item>
  </template>
</template>

<script>
  import {defineComponent} from 'vue'

  export default defineComponent({
    name: 'EssentialLink',
    props: {
      id: {
        type: String,
      },

      title: {
        type: String,
        required: true,
      },

      caption: {
        type: String,
        default: '',
      },

      link: {
        type: String,
        default: '#',
      },

      icon: {
        type: String,
        default: '',
      },

      expand: Boolean,

      children: {
        type: Array,
      },

      allow: Boolean,
    },
  })
</script>
