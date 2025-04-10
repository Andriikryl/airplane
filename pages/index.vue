<template>
  <NuxtLayout name="main">
    <Card class="max-w-[600px]">
      <CardHeader>
        <CardTitle>Тестове завдання</CardTitle>
        <CardDescription>Тестове завдання полягає у створенні невеликого віджету (сторінки), який переглядає історію польоту умовного БПЛА.</CardDescription>
      </CardHeader>
      <CardContent class="relative max-w-[600px]">
        <div ref="canvasContainer" class="w-full aspect-square">
          <canvas
            ref="canvas"
            class="border w-full h-full"
          />
        </div>
        <p class="absolute top-[20px] left-1/2 transform -translate-x-1/2 z-20">N 360°</p>
        <p class="absolute left-[20px] top-1/2 transform -translate-y-1/2 z-20">
          <span class="inline-block transform rotate-270">
            W 270°
          </span>
        </p>
        <p class="absolute bottom-[20px] left-1/2 transform -translate-x-1/2 z-20">N 360°</p>
        <p class="absolute right-[20px] top-1/2 transform -translate-y-1/2 z-20">
          <span class="inline-block transform rotate-90">
            E 90°
          </span>
        </p>
      </CardContent>
      <CardFooter>
        <Button @click="toggleFlight">
          {{ isFlying ? "Стоп" : "Почати" }}
        </Button>
      </CardFooter>
    </Card>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, shallowRef, computed, watch } from "vue";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { flightData } from "~/data/data";

const canvas = ref<HTMLCanvasElement | null>(null);
const canvasContainer = ref<HTMLElement | null>(null);
const ctx = ref<CanvasRenderingContext2D | null>(null);


const canvasWidth = ref(600);
const canvasHeight = ref(600);

const isFlying = ref(false);
let animationFrameId: number;
let currentIndex = 0;
const position = ref({ x: 0, y: 0 });
const path: { x: number; y: number }[] = [];

const totalTime = 20000; // 20 сек
const stepTime = totalTime / (flightData.length - 1);


const droneImage = shallowRef<HTMLImageElement | null>(null);

const center = computed(() => ({
  x: canvasWidth.value / 2,
  y: canvasHeight.value / 2
}));

const toggleFlight = () => {
  if (isFlying.value) {
    cancelAnimationFrame(animationFrameId);
    reset();
  } else {
    isFlying.value = true;
    currentIndex = 0;
    path.length = 0;
    position.value = { x: center.value.x, y: center.value.y }; 
    if (path.length === 0) {
      path.push({ ...position.value });
    }
    animate();
  }
};

const reset = () => {
  isFlying.value = false;
  if (!ctx.value) return;
  ctx.value.setTransform(1, 0, 0, 1, 0, 0);
  ctx.value.clearRect(0, 0, canvasWidth.value, canvasHeight.value);
  drawDrone();
};

const drawDrone = (angle = 0) => {
  const context = ctx.value;
  if (!context || !droneImage.value || !droneImage.value.complete) return;

  context.save();


  context.setTransform(1, 0, 0, 1, 0, 0);
  const camX = position.value.x - canvasWidth.value / 2;
  const camY = position.value.y - canvasHeight.value / 2;
  context.translate(-camX, -camY);

  if (path.length > 1) {
    context.strokeStyle = "lime";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) {
      context.lineTo(path[i].x, path[i].y);
    }
    context.stroke();
  }


  context.translate(position.value.x, position.value.y);
  context.rotate((angle * Math.PI) / 180);
  context.drawImage(droneImage.value, -15, -15, 30, 30);
  context.restore();
};

const animate = () => {
  if (currentIndex >= flightData.length - 1) {
    isFlying.value = false;
    return;
  }

  const from = flightData[currentIndex];
  const to = flightData[currentIndex + 1];

  const steps = 60;
  let frame = 0;

  const direction = parseFloat(to.direction);
  const speed = parseFloat(to.speed);
  const radians = (direction * Math.PI) / 180;
  const distance = speed / 10;

  const dx = Math.cos(radians) * (distance / steps);
  const dy = Math.sin(radians) * (distance / steps);

  const step = () => {
    if (frame < steps) {
      position.value.x += dx;
      position.value.y += dy;
      path.push({ x: position.value.x, y: position.value.y });
      if (ctx.value) {
        ctx.value.clearRect(0, 0, canvasWidth.value, canvasHeight.value);
      }
      drawDrone(direction);
      frame++;
      animationFrameId = requestAnimationFrame(step);
    } else {
      currentIndex++;
      animate();
    }
  };
  step();
};


const resizeCanvas = () => {
  if (!canvasContainer.value || !canvas.value) return;
  
  const containerWidth = canvasContainer.value.clientWidth;
  canvasWidth.value = containerWidth;
  canvasHeight.value = containerWidth; 
  

  canvas.value.width = canvasWidth.value;
  canvas.value.height = canvasHeight.value;
  
  if (isFlying.value) {
    drawDrone();
  } else {
    reset();
  }
};

onMounted(() => {
  if (canvas.value) {
    ctx.value = canvas.value.getContext("2d");

    resizeCanvas();

    window.addEventListener('resize', resizeCanvas);

    if (typeof window !== "undefined") {
      droneImage.value = new Image();
      droneImage.value.src = "/drone.svg"; 
      droneImage.value.onload = () => {
        position.value = { x: center.value.x, y: center.value.y }; 
        drawDrone();
      };
    }
  }
});


onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCanvas);
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
});
</script>