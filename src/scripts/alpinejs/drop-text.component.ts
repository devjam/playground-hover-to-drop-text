import sound1 from '@/assets/audio/button.wav'
import sound3 from '@/assets/audio/notification.wav'
import sound4 from '@/assets/audio/progress_loop.wav'
import sound5 from '@/assets/audio/toggle_off.wav'
import Alpine from 'alpinejs'
import gsap from 'gsap'
import { Physics2DPlugin } from 'gsap/Physics2DPlugin'
import { SplitText } from 'gsap/SplitText'
import GUI from 'lil-gui'
import debounce from 'lodash/debounce'

Alpine.data('dropText', () => {
  const soundSources = [sound1, sound3, sound4, sound5] as const
  let sounds: HTMLAudioElement[] | null = null

  let splitInstance: SplitText | null = null
  let splitInstance2: SplitText | null = null

  let pointerSpeed = 0
  let pointerLastX = 0
  let pointerLastY = 0
  let lastTime = 0

  let isResetAnimating = false

  const gui = new GUI()

  return {
    guiParams: {
      text: '👉Hover me!!!',
      textColor: '#1C1C1C',
      gravity: 800,
      acceleration: 1200,
      velocity: {
        min: 100,
        max: 650,
      },
      randomRotate: 90,
      velocityMultiplier: 1,
      spinMultiplier: 1, // 回転倍率 (1 = 現在と同等, 4 = 4倍激しく)
    },
    init() {
      gsap.ticker.fps(60)
      gsap.registerPlugin(Physics2DPlugin, SplitText)
      this.initAudio()
      this.updateText()
      this.setGui()
    },
    initAudio() {
      sounds = soundSources.map((src) => {
        const audio = new Audio(src)
        audio.preload = 'auto'
        audio.volume = 0.5
        return audio
      })
    },
    drop(el: HTMLElement, event: PointerEvent) {
      // 既に落下開始済みなら二度反応させない
      if (el.dataset.dropped || isResetAnimating) return
      el.dataset.dropped = 'true'
      el.classList.add('!pointer-events-none')
      this.playSound()

      const rect = el.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const deltaX = event.clientX - centerX
      const deltaY = event.clientY - centerY

      const angle = gsap.utils.wrap(0, 360, (Math.atan2(deltaY, deltaX) * 180) / Math.PI + 180)
      const velocity =
        gsap.utils.clamp(
          this.guiParams.velocity.min,
          this.guiParams.velocity.max,
          pointerSpeed * 1.2,
        ) * this.guiParams.velocityMultiplier

      gsap.to(el, {
        duration: 5,
        physics2D: {
          angle: angle,
          velocity: velocity,
          gravity: this.guiParams.gravity,
          // acceleration: this.guiParams.acceleration,
        },
        rotation:
          gsap.utils.random(-this.guiParams.randomRotate, this.guiParams.randomRotate) *
          this.guiParams.spinMultiplier,
        onComplete: () => {
          el.style.visibility = 'hidden'
        },
      })
    },
    onPointermove(event: PointerEvent) {
      const now = performance.now()
      if (lastTime) {
        const dt = now - lastTime
        const dx = event.clientX - pointerLastX
        const dy = event.clientY - pointerLastY
        const distance = Math.hypot(dx, dy)
        pointerSpeed = (distance / dt) * 1000 // px/s
      }
      lastTime = now
      pointerLastX = event.clientX
      pointerLastY = event.clientY
    },
    destroySplitInstance() {
      if (splitInstance) {
        splitInstance.revert()
        splitInstance = null
      }
      if (splitInstance2) {
        splitInstance2.revert()
        splitInstance2 = null
      }
    },
    updateText() {
      this.destroySplitInstance()

      // テキストを書き換え
      this.$refs.hoverText.innerHTML = this.guiParams.text
      this.$refs.staticText.innerHTML = this.guiParams.text

      // 再スプリット
      splitInstance = SplitText.create(this.$refs.hoverText, { type: 'chars' })
      splitInstance2 = SplitText.create(this.$refs.staticText, { type: 'chars' })

      splitInstance.chars.forEach((char) => {
        char.classList.add('cursor-pointer')
        // @ts-ignore
        char.addEventListener('pointerenter', (event: PointerEvent) => this.drop(char, event))
      })
    },
    playSound() {
      if (!sounds || !sounds.length) return
      const audio = sounds[Math.floor(Math.random() * sounds.length)]
      audio.currentTime = 0
      audio.volume = 0.5
      audio.play().catch(() => {})
    },
    randomText() {
      const phrases = [
        'Breathe in calm 😌',
        'Keep moving!',
        'Drift on silent clouds',
        'Slow moments, soft hearts',
        'Coffee steam and<br> morning hush ☕️',
        'Just hover it!',
        'One step, one smile 🙂',
        'Sunsets paint in whispers 🌅',
        'Peace blooms in pauses',
        'Still lake, still soul',
        'Sometimes the best journey is simply resting in the quiet places within yourself.',
        'Let the world spin while you sit still, feeling each breath like a gentle tide 🌿',
        'Warm tea, cool breeze',
        'Stars glow, worries fade ✨',
        'Calm minds, kind hearts',
      ]
      const index = Math.floor(Math.random() * phrases.length)
      // 前回と同じテキストなら再度ランダム選択
      if (this.guiParams.text === phrases[index]) {
        this.randomText()
        return
      }
      this.guiParams.text = phrases[index]
      this.updateText()
    },
    reset() {
      if (isResetAnimating || !splitInstance) return
      splitInstance.chars.forEach((char: HTMLElement) => {
        if (char.dataset.dropped) {
          isResetAnimating = true
          gsap.to(char, {
            duration: 0.8,
            x: 0,
            y: 0,
            rotation: 0,
            overwrite: true,
            ease: 'power4.out',
            onStart: () => {
              char.style.visibility = ''
            },
            onComplete: () => {
              char.removeAttribute('data-dropped')
              char.classList.remove('!pointer-events-none')
              isResetAnimating = false
            },
          })
        }
      })
    },
    setGui() {
      gui
        .add(this.guiParams, 'text')
        .name('Text')
        .onChange(debounce(() => this.updateText(), 150))
        .listen()
      gui.addColor(this.guiParams, 'textColor').name('Text Color')
      gui.add(this.guiParams, 'gravity', 0, 3000).name('Gravity').step(1)
      gui.add(this.guiParams.velocity, 'max', 110, 1000).name('MaxVelocity').step(1)
      // gui.add(this.guiParams, 'randomRotate', 10, 1000).name('RandomRotate').step(1)
      gui.add(this.guiParams, 'velocityMultiplier', 1, 2).name('VelocityMultiplier').step(0.1)
      gui.add(this.guiParams, 'spinMultiplier', 1, 100).name('SpinMultiplier').step(1)
      gui.add(this, 'randomText').name('RandomText')
      gui.add(this, 'reset').name('Reset Text')
    },
  }
})
