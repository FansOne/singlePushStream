<template>
  <div class="overall">
    <!-- 步骤条盒子 -->
    <div class="steps-box">
      <!-- 步骤条 -->
      <div class="Article-steps">
        <!-- 步骤条背景进度条 -->
        <div class="line">
          <span
            class="plan"
            :style="`width:${activeIndex*(100/(stepList.length - 1)) - (100/(stepList.length - 1)/2)}%`"
          ></span>
        </div>
        <!-- 每步部分 -->
        <span
          class="step"
          v-for="(i,index) in stepList"
          :key="index"
          :class="activeIndex == i.stepIndex || i.stepIndex<=activeIndex ? 'step-active':''"
        >
          <div class="step-num">
            <div class="num">
                <span class="iconfont" :class="{'icon-monitor':i.stepIndex===1,'icon-maikefeng':i.stepIndex===2,'icon-shezhi1':i.stepIndex===3}"></span>
            </div>

            <div v-if="i.fail" class="step-fail">
                <i class="el-icon-warning"></i>
            </div>
            <div v-if='i.success' class="step-fail step-success">
                <i class="el-icon-success"></i>
            </div>
          </div>
          <p class="title">{{i.title}}</p>
        </span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      //当前位置
      activeIndex: 1,
      //步骤条步数
      stepList: [
        {
          stepIndex: 1,
          title: "摄像头"
        },
        {
          stepIndex: 2,
          title: "麦克风"
        },
        {
          stepIndex: 3,
          title: "检测结果"
        }
      ]
    };
  },
  methods: {
    //点击可以看到
    nextStep(callback) {
        if(this.activeIndex>=3){
            this.stepList.forEach((item,index) =>{
                item.success = false
                item.fail = false
            })
        }else{
            this.stepList.forEach((item,index) =>{
                if(this.activeIndex-1 === index){
                    item.success = true
                }
            })
        }
        
        this.activeIndex += 1;
        callback(this.activeIndex)
    },
    //点击不可以看到
    stepFail(callback) {
        if(this.activeIndex>=3){
            this.activeIndex = 1
            this.stepList.forEach((item,index) =>{
                item.fail = false
                item.success = false
            })
        }else{
            this.stepList.forEach((item,index) =>{
                if(this.activeIndex-1 === index){
                    item.fail = true
                }
            })

            this.activeIndex += 1;
        }

        callback(this.activeIndex)

    }
  }
};
</script>

<style lang="less" scoped>
.steps-box {
  user-select: none;
  width: 100%;
  position: relative;
  // <!-- 步骤条背景进度条 -->
  .line {
    display: block;
    margin: 0 auto;
    position: absolute;
    top: 24px;
    left: 5%;
    background: #c0c0c0;
    width: 90%;
    height: 2px;
    overflow: hidden;
    .plan {
      position: absolute;
      top: 0;
      left: 0;
      height: 2px;
      transition: 0.5s;
      background: #8ab4f3;
    }
  }
  .Article-steps {
    display: flex;
    justify-content: space-between;
    .step {
        display: flex;
        flex-direction: column;
        align-items: center;
      .title {
        font-size: 13px;
        color: #808080;
        margin-top: 7px;
      }
      .step-num {
        position: relative;
        z-index: 1;
        width: 50px;
        height: 50px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: #c0c0c0;
        color: white;
        transition: 0.5s;
        .num {
          transition: 0.5s;
          display: inline-block;
          span{
              font-size: 25px;
          }
        }
        .step-fail{
            background-color: #fff;
            border-radius: 50%;
            position: absolute;
            top: -4px;
            right: 0px;
            color: red;
            line-height: 15px;
            text-align: center;
            font-size: 17px;
        }
        .step-success{
            color: #67C23A !important;
        }
      }
    }
  }

  //当前所在位置样式
  .step-active {
    .step-num {
      background: #2d7df5 !important;
      //transform: rotate(90deg);
      .num {
        //transform: rotate(-90deg);
      }
    }
    .title {
      color: #2d7df5 !important;
    }
  }

  //对应内容
  .Article-content {
    padding: 20px;
    .btn {
      width: 150px;
      display: block;
      margin: 0 auto;
      margin-bottom: 10px;
      background: #2d7df5;
      color: white;
      padding: 10px;
      border-radius: 5px;
      cursor: pointer;
    }
    .content{
      padding: 20px;
    }
  }
}
</style>