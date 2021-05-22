// CRIO_SOLUTION_START_MODULE_CREATE_PROFILE
// CRIO_SOLUTION_END_MODULE_CREATE_PROFILE
import React from "react";
import { Layout } from "components/common";
import { Intro, Contact, Projects } from "components/landing";
import { Education } from "components/landing/Education";
import { Skills } from "components/landing/Skills";
import { Experience } from "components/landing/Experience";
import { Organisations } from "components/landing/Organisations";

export default () => (
  <Layout>
    <Intro />
    <Experience/>
    <Projects />
    <Education />
    <Skills/>
    <Organisations/>
    {/* <Contact /> */}
  </Layout>
);
