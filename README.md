# Dynavatar - Dynamic Avatar Generator

It is drawing a random image based on the seed

Example:

```typescript
import { drawDynavatar,DEFAULT_SHADER_SETTINGS} from 'dynavatar'

const canvas = document.getElementById('canvas') as HTMLCanvasElement
const random = new Float32Array()

random[0] = Math.random()
random[1] = Math.random()
random[2] = Math.random()
random[3] = Math.random()

drawDynavatar(
  random,
  canvas,
  canvas.width,
  canvas.height,
  DEFAULT_SHADER_SETTINGS
)
```
