package com.cdmga.uestc.webpage.Repository;

import com.cdmga.uestc.webpage.Entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeamRepository extends JpaRepository<Team, Integer> {

    @Query("select t from Team t where t.courseId = :courseId and t.teamId between :startTeamId and :endTeamId order by t.teamId asc, t.id asc")
    List<Team> findByCourseIdAndTeamIdRange(
            @Param("courseId") Integer courseId,
            @Param("startTeamId") Integer startTeamId,
            @Param("endTeamId") Integer endTeamId
    );

        @Query("select t from Team t where t.courseId = :courseId and t.teamId is not null and t.teamId between :startTeamId and :endTeamId order by t.teamId asc, t.id asc")
        List<Team> findAssignedByCourseIdAndTeamIdRange(
            @Param("courseId") Integer courseId,
            @Param("startTeamId") Integer startTeamId,
            @Param("endTeamId") Integer endTeamId
        );

    @Query("select coalesce(max(t.teamId), 0) from Team t where t.courseId = :courseId")
    Integer findMaxTeamIdByCourseId(@Param("courseId") Integer courseId);

    @Query("select coalesce(max(t.id), 0) from Team t")
    Integer findMaxId();

    @Query("select count(t) from Team t where t.courseId = :courseId and t.teamId = :teamId")
    long countByCourseIdAndTeamId(@Param("courseId") Integer courseId, @Param("teamId") Integer teamId);

    List<Team> findByCourseIdAndTeamId(Integer courseId, Integer teamId);

    List<Team> findByCourseIdAndTeamIdIsNotNull(Integer courseId);

    Optional<Team> findByCourseIdAndIdentityId(Integer courseId, Integer identityId);
}
