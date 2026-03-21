<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'

onLaunch(() => {
  console.log('QMG App Launch')
})

onShow(() => {
  console.log('QMG App Show')
})

onHide(() => {
  console.log('QMG App Hide')
})
</script>

<style>
	/*每个页面公共css */
</style>
