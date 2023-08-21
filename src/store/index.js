import { store } from 'quasar/wrappers'
import { createStore } from 'vuex'
import { UsersModule } from './modules/users'
import { PlatformsModule } from './modules/platforms'
import { BuildsFeedModule } from './modules/builds'
import { ReleaseFeedModule } from './modules/release'
import { ErrataFeedModule } from './modules/errata'
import { TeamsModule } from './modules/teams'
import { TestRepositoriesModule } from './modules/test_repositories'
import { KeysModule } from './modules/keys'
import { PlatformFlavorsModule } from './modules/platform_flavors'
import { ProductsModule } from './modules/products'
import { parseJwt } from 'src/utils'

// import example from './module-example'

/*
 * If not building with SSR mode, you can
 * directly export the Store instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Store instance.
 */

export default store(createStore({
    modules: {
      users: UsersModule,
      platforms: PlatformsModule,
      buildsFeed: BuildsFeedModule,
      releaseFeed: ReleaseFeedModule,
      errataFeed: ErrataFeedModule,
      teams: TeamsModule,
      testRepositories: TestRepositoriesModule,
      keys: KeysModule,
      platform_flavors: PlatformFlavorsModule,
      products: ProductsModule
    },

    getters: {
      /* Returns true if user is authenticated, false otherwise. */
      isAuthenticated: state => {
        return state.users.self !== null
      },
      accessToken: state => {
        if (state.users.self === null) {
          return null
        }
        return state.users.self.jwt_token
      },
      isUserValid: state => {
        if (state.users.self !== null) {
          let token = parseJwt(state.users.self.jwt_token)
          return new Date(token.exp * 1000) > Date.now()
        } else {
          return false
        }
      },
      isAdmin: state => {
        return state.users.isAdmin
      }
    },
    // enable strict mode (adds overhead!)
    // for dev mode and --debug builds only
    strict: process.env.DEBUGGING
  })
)
