<template>
  <q-page>
    <div>
      <BuildFeedItem
        v-for="build in builds"
        :key="build._id"
        :build="build"
        style="margin-top: 1vw;"
      />
    </div>
  </q-page>
</template>

<script>
import { defineComponent } from 'vue';
import BuildFeedItem from 'components/BuildFeedItem.vue';

export default defineComponent({
  name: 'BuildFeed',
  data () {
    return {
      builds: []
    }
  },
  created () {
    this.loadFeedPage()
  },
  methods: {
    loadFeedPage () {
      this.$api.get('/builds/')
        .then(response => {
          this.builds = response.data
        })
        .catch(error => {
        })
    }
  },
  components: {
    BuildFeedItem
  }
})
</script>
