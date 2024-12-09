import { AddQuestionForm } from '@/components/AddQuestionForm'
import React from 'react'

type Props = {}

const page = (props: Props) => {
  return (
    <div className='py-5 px-10'>
      <AddQuestionForm />
    </div>
  )
}

export default page