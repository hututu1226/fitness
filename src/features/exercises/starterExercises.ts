import type { BodyPart, CreateExerciseInput } from '../../db/schema'

function presetExercise(
  name: string,
  bodyPart: BodyPart,
  illustrationKey: string,
  notes: string,
  exerciseType: CreateExerciseInput['exerciseType'] = 'strength',
): CreateExerciseInput {
  return {
    name,
    bodyPart,
    exerciseType,
    notes,
    illustrationKey,
    isPreset: true,
  }
}

export const starterExercises: CreateExerciseInput[] = [
  presetExercise('杠铃卧推', 'chest', 'barbell-bench-press', '胸部最常见的基础复合动作，适合记录重量和次数。'),
  presetExercise('上斜哑铃卧推', 'chest', 'incline-dumbbell-press', '偏上胸的基础推举动作，也适合做主练或辅助。'),
  presetExercise('双杠臂屈伸', 'chest', 'chest-dips', '自重推类动作，胸和肱三头都会参与。', 'bodyweight'),
  presetExercise('哑铃飞鸟', 'chest', 'dumbbell-flyes', '更适合补充胸部拉伸和收缩感。'),
  presetExercise('绳索夹胸', 'chest', 'cable-crossover', '胸部孤立动作，适合中高次数训练。'),
  presetExercise('俯卧撑', 'chest', 'pushups', '最基础的自重推类动作，适合热身、补量和居家训练。', 'bodyweight'),
  presetExercise('史密斯卧推', 'chest', 'smith-machine-bench-press', '轨迹更稳定，适合胸部主练和靠近力竭的训练。'),
  presetExercise('蝴蝶机夹胸', 'chest', 'butterfly', '常见器械夹胸动作，更容易专注胸部收缩。'),

  presetExercise('传统硬拉', 'back', 'barbell-deadlift', '后链基础动作，重点在臀腿发力和背部稳定。'),
  presetExercise('杠铃划船', 'back', 'bent-over-barbell-row', '背部水平拉基础动作，适合建立上背厚度。'),
  presetExercise('引体向上', 'back', 'pullups', '经典自重拉动作，主要训练背阔肌和手臂。', 'bodyweight'),
  presetExercise('高位下拉', 'back', 'wide-grip-lat-pulldown', '引体向上的常见替代动作，适合补量。'),
  presetExercise('坐姿划船', 'back', 'seated-cable-rows', '稳定性更好，便于专注背部收缩。'),
  presetExercise('面拉', 'back', 'face-pull', '上背和后三角常用动作，适合肩部健康。'),

  presetExercise('杠铃深蹲', 'legs', 'barbell-full-squat', '下肢最基础的复合动作，重点训练股四头肌和臀部。'),
  presetExercise('罗马尼亚硬拉', 'legs', 'romanian-deadlift', '偏臀腿后侧发力，适合补强腘绳肌。'),
  presetExercise('腿举', 'legs', 'leg-press', '器械下肢推类动作，容易稳定加重量。'),
  presetExercise('保加利亚分腿蹲', 'legs', 'split-squat-with-dumbbells', '常用单侧腿部动作，兼顾稳定和臀腿刺激。'),
  presetExercise('行走弓步蹲', 'legs', 'barbell-walking-lunge', '动态单侧动作，适合训练平衡和髋膝控制。'),
  presetExercise('腿弯举', 'legs', 'lying-leg-curls', '常见腿后侧孤立动作。'),

  presetExercise('站姿推举', 'shoulders', 'standing-military-press', '肩部基础推举动作，也考验核心稳定。'),
  presetExercise('哑铃肩推', 'shoulders', 'dumbbell-shoulder-press', '自由度高，适合做主要肩部推举。'),
  presetExercise('侧平举', 'shoulders', 'side-lateral-raise', '中束三角肌最基础的孤立动作。'),
  presetExercise('俯身后束飞鸟', 'shoulders', 'seated-bent-over-rear-delt-raise', '后束三角肌和上背常用补充动作。'),
  presetExercise('阿诺德推举', 'shoulders', 'arnold-dumbbell-press', '肩部推举变式，活动路径更长。'),
  presetExercise('直立划船', 'shoulders', 'standing-dumbbell-upright-row', '肩部和上背常见辅助动作，适合中等重量训练。'),

  presetExercise('杠铃弯举', 'arms', 'barbell-curl', '肱二头基础动作，适合做主要弯举。'),
  presetExercise('哑铃交替弯举', 'arms', 'seated-dumbbell-curl', '经典手臂训练动作，操作简单。'),
  presetExercise('锤式弯举', 'arms', 'hammer-curls', '兼顾肱肌和前臂。'),
  presetExercise('绳索下压', 'arms', 'triceps-pushdown', '肱三头最常见的器械动作。'),
  presetExercise('仰卧臂屈伸', 'arms', 'cable-lying-triceps-extension', '常见肱三头自由重量动作。'),
  presetExercise('窄距俯卧撑', 'arms', 'close-triceps-pushups', '自重三头补量动作。', 'bodyweight'),

  presetExercise('平板支撑', 'core', 'plank', '核心稳定基础动作，适合热身和收尾。', 'bodyweight'),
  presetExercise('侧平板支撑', 'core', 'side-bridge', '偏重侧链和抗侧屈能力。', 'bodyweight'),
  presetExercise('悬垂举腿', 'core', 'hanging-leg-raise', '常见腹部和髋屈肌动作。', 'bodyweight'),
  presetExercise('卷腹', 'core', 'crunch-hands-overhead', '基础腹部屈曲动作。', 'bodyweight'),
  presetExercise('俄罗斯转体', 'core', 'russian-twist', '常见旋转类腹部动作。', 'bodyweight'),
  presetExercise('死虫', 'core', 'dead-bug', '适合练核心稳定和四肢配合。', 'bodyweight'),
  presetExercise('下腰', 'core', 'hyperextensions-back-extensions', '腿部固定后通过下腰与挺身训练核心和后链稳定。', 'bodyweight'),
]
