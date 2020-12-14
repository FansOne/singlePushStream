<template>
    <div class="container">
        <img src="../assets/img/err.png" alt="">
        <div>媒体设备不可用，请检查后重试!</div>
        <div><i class="el-icon-warning"></i><span>Error Message:{{errInfo}}!</span></div>
    </div>
</template>

<script>

    export default {
        data(){
            return{
                errInfo: sessionStorage.getItem('errInfo')
            }
        },
        created(){
            if(this.$route.params.code === undefined) window.location.href = `${window.SITE_CONFIG['BASE_URL']}/play/live/teacher/${this.$store.state.USER.ROOM_ID}/${sessionStorage.getItem('liveCode')}`;
        }
    }
</script>

<style lang='less' scoped>
    .container{
        width: 100%;
        height: 100vh;
        background-color: #f1f1f1;
        display: flex;
        align-items: center;
        flex-direction: column;
        img{
            width: 300px;
            height: 333px;
            margin-top: 155px;
        }
        div:first-of-type{
            font-size: 27px;
        }
        div:last-of-type{
            margin-top: 15px;
            i{
                font-size: 13px;
                display: inline-block;
                margin-right: 3px;
                color: #e6a23c;
            }
            color: rgb(99, 99, 99);
        }
    }
</style>