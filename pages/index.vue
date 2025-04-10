<template>
  <NuxtLayout name="main">
    <Card class="max-w-[600px]">
      <CardHeader>
        <CardTitle>Тестове завдання</CardTitle>
        <CardDescription>Тестове завдання полягає у створенні невеликого віджету (сторінки), який переглядає історію польоту умовного БПЛА.</CardDescription>
      </CardHeader>
      <CardContent class="relative max-w-[600px] card-content">
        <div ref="canvasContainer" class="w-full aspect-square">
          <canvas
            ref="canvas"
            class="w-full h-full"
          />
        </div>
        <p class="absolute top-[20px] text-white left-1/2 transform -translate-x-1/2 z-20">N 360°</p>
        <p class="absolute left-[20px] top-1/2 transform -translate-y-1/2 z-20">
          <span class="inline-block text-white transform rotate-270">
            W 270°
          </span>
        </p>
        <p class="absolute bottom-[20px] text-white left-1/2 transform -translate-x-1/2 z-20">S 180°</p>
        <p class="absolute right-[20px] text-white top-1/2 transform -translate-y-1/2 z-20">
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

const cameraOffset = ref({ x: 0, y: 0 });

const currentDirection = ref(0);

const totalTime = 20000; // 20 сек
const stepTime = totalTime / (flightData.length - 1);

const droneImage = shallowRef<HTMLImageElement | null>(null);

const center = computed(() => ({
  x: canvasWidth.value / 2,
  y: canvasHeight.value / 2
}));

const maxDistanceFromCenter = computed(() => Math.min(canvasWidth.value, canvasHeight.value) * 0.4);

const toggleFlight = () => {
  if (isFlying.value) {
    cancelAnimationFrame(animationFrameId);
    reset();
  } else {
    isFlying.value = true;
    currentIndex = 0;
    path.length = 0;
    position.value = { x: center.value.x, y: center.value.y }; 
    cameraOffset.value = { x: 0, y: 0 };
    currentDirection.value = 0;
    if (path.length === 0) {
      path.push({ ...position.value });
    }
    animate();
  }
};

const reset = () => {
  isFlying.value = false;
  if (!ctx.value) return;
  
  position.value = { x: center.value.x, y: center.value.y };
  cameraOffset.value = { x: 0, y: 0 };
  currentDirection.value = 0;

  path.length = 0;
  path.push({ ...position.value });

  drawScene();
};

const updateCamera = () => {
  const droneScreenX = position.value.x - cameraOffset.value.x;
  const droneScreenY = position.value.y - cameraOffset.value.y;
  
  const distanceFromCenterX = droneScreenX - center.value.x;
  const distanceFromCenterY = droneScreenY - center.value.y;
  
  if (Math.abs(distanceFromCenterX) > maxDistanceFromCenter.value) {
    const adjustment = distanceFromCenterX > 0 ? 
      distanceFromCenterX - maxDistanceFromCenter.value : 
      distanceFromCenterX + maxDistanceFromCenter.value;
    cameraOffset.value.x += adjustment;
  }
  
  if (Math.abs(distanceFromCenterY) > maxDistanceFromCenter.value) {
    const adjustment = distanceFromCenterY > 0 ? 
      distanceFromCenterY - maxDistanceFromCenter.value : 
      distanceFromCenterY + maxDistanceFromCenter.value;
    cameraOffset.value.y += adjustment;
  }
};

const drawScene = () => {
  if (!ctx.value) return;

  ctx.value.clearRect(0, 0, canvasWidth.value, canvasHeight.value);  

  ctx.value.save();

  ctx.value.translate(-cameraOffset.value.x, -cameraOffset.value.y);
  
  if (path.length > 1) {
    ctx.value.strokeStyle = "lime";
    ctx.value.lineWidth = 2;
    ctx.value.beginPath();
    ctx.value.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) {
      ctx.value.lineTo(path[i].x, path[i].y);
    }
    ctx.value.stroke();
  }
  
  drawDrone(currentDirection.value);
  
  ctx.value.restore();
};

const drawDrone = (angle = 0) => {
  const context = ctx.value;
  if (!context || !droneImage.value || !droneImage.value.complete) return;

  context.save();
  context.translate(position.value.x, position.value.y);
  

  context.rotate(((angle) * Math.PI) / 90);
  
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

  currentDirection.value = direction;
  
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
      
      updateCamera();
      
      drawScene();
      
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
    drawScene();
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
        drawScene();
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

<style>
.card-content{
  background-color: aqua;
  background-image: url("../public/bg.jpg");
}
</style>